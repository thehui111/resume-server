import json
from typing import AsyncIterator, Dict, Any

import json_repair

from app.service.ai.claude_runner import run_claude_text
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

OPTIMIZE_SYSTEM_PROMPT = """\
你是一位专业简历优化顾问，擅长根据目标职位 JD 优化简历以提高匹配度。

优化原则：
1. 在描述中自然融入 JD 的关键词（技术栈/职责关键词/软技能等）
2. 调整表达方式，突出 JD 最看重的能力和经验
3. 绝对不能虚构经历、学历、技能，只能优化措辞和侧重点
4. 保持原有结构，只修改文字内容
5. 输出严格的 JSON 格式，结构与输入相同，不要包含任何 markdown 标记
"""

OPTIMIZE_USER_TEMPLATE = """\
目标岗位 JD：
{jd_text}

需要优化的简历内容：
{current_sections_json}

请针对 JD 优化上述简历内容，输出与输入结构完全相同的 JSON，只修改文字，不改变 key 结构。
"""


async def stream_jd_optimize(
    jd_text: str,
    current_sections: Dict[str, Any],
) -> AsyncIterator[str]:
    """
    根据 JD 优化简历 sections，流式返回。
    每个 section 完成后 yield 一条 SSE data。
    """
    sections_json = json.dumps(current_sections, ensure_ascii=False, indent=2)
    prompt = OPTIMIZE_USER_TEMPLATE.format(
        jd_text=jd_text[:3000],  # 防止 JD 过长超 token
        current_sections_json=sections_json,
    )

    try:
        full_text, usage = await run_claude_text(
            system_prompt=OPTIMIZE_SYSTEM_PROMPT,
            user_prompt=prompt,
        )
    except Exception as e:
        logger.error(f"Claude stream_jd_optimize 失败: {e}")
        yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        return

    try:
        parsed: Dict[str, Any] = json_repair.loads(full_text)
    except Exception as e:
        logger.error(f"JD 优化结果 JSON 解析失败: {e}, raw={full_text[:200]}")
        yield f"data: {json.dumps({'error': 'JSON 解析失败'}, ensure_ascii=False)}\n\n"
        return

    for section_type, content in parsed.items():
        payload = {"section": section_type, "content": content}
        yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    yield f"data: {json.dumps({'done': True, 'usage': usage}, ensure_ascii=False)}\n\n"
