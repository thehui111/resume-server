import json
from typing import AsyncIterator, Dict, Any, List

import json_repair

from app.service.ai.claude_runner import run_claude_text
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

GENERATE_SYSTEM_PROMPT = """\
你是一位专业的简历写作顾问，帮助用户生成高质量的中文简历内容。

输出要求：
1. 工作经历每条描述使用 STAR 法则（情境/任务/行动/结果），尽量量化成果（如"将系统延迟降低 40%"）
2. 个人总结突出核心竞争力，不超过 80 字
3. 技能按熟练度排序，分 languages/frameworks/tools 三类
4. 输出严格的 JSON 格式，不要包含任何 markdown 标记或多余文字
5. 只输出被要求的 section，不要额外增加
"""

GENERATE_USER_TEMPLATE = """\
目标职位：{target_role}

用户原始信息：
{raw_info}

请生成以下 section 的简历内容：{sections}

输出 JSON 格式（每个 section 作为顶层 key），示例结构：
{{
  "summary": {{"text": "..."}},
  "work_exp": [{{"company": "...", "title": "...", "start": "YYYY-MM", "end": "YYYY-MM", "description": "..."}}, ...],
  "education": [{{"school": "...", "degree": "...", "major": "...", "start": "YYYY-MM", "end": "YYYY-MM"}}, ...],
  "skills": {{"languages": [], "frameworks": [], "tools": []}},
  "projects": [{{"name": "...", "role": "...", "description": "...", "tech_stack": []}}],
  "basic_info": {{"name": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "", "github": ""}}
}}
"""


async def stream_generate(
    target_role: str,
    raw_info: Dict[str, Any],
    sections: List[str],
) -> AsyncIterator[str]:
    """
    流式生成简历内容，逐 section 以 SSE data 形式 yield。
    最终 yield {"done": true, "usage": {...}}
    """
    raw_info_str = "\n".join(f"- {k}: {v}" for k, v in raw_info.items())
    sections_str = "、".join(sections)

    prompt = GENERATE_USER_TEMPLATE.format(
        target_role=target_role,
        raw_info=raw_info_str,
        sections=sections_str,
    )

    try:
        full_text, usage = await run_claude_text(
            system_prompt=GENERATE_SYSTEM_PROMPT,
            user_prompt=prompt,
        )
    except Exception as e:
        logger.error(f"Claude stream_generate 失败: {e}")
        yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        return

    try:
        parsed: Dict[str, Any] = json_repair.loads(full_text)
    except Exception as e:
        logger.error(f"AI 生成结果 JSON 解析失败: {e}, raw={full_text[:200]}")
        yield f"data: {json.dumps({'error': 'JSON 解析失败'}, ensure_ascii=False)}\n\n"
        return

    for section_type in sections:
        if section_type in parsed:
            payload = {"section": section_type, "content": parsed[section_type]}
            yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    yield f"data: {json.dumps({'done': True, 'usage': usage}, ensure_ascii=False)}\n\n"
