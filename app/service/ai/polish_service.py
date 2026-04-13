import json
from typing import List

from app.service.ai.claude_runner import run_claude_text
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

POLISH_SYSTEM_PROMPT = """\
你是一位专业的简历文字润色专家。用户会给你一段简历中的文字，请你提供 3 个不同风格的润色版本。

要求：
1. 保持原文的核心信息和事实不变
2. 三个版本分别侧重：①更专业精炼 ②更量化/结果导向 ③更生动有感染力
3. 使用与原文相同的语言（中文输入则中文输出，英文输入则英文输出）
4. 输出严格的 JSON 格式，不要包含任何 markdown 标记或多余文字
"""

POLISH_USER_TEMPLATE = """\
请润色以下简历文字，返回 3 个版本：

---
{text}
---

输出 JSON 格式：
{{
  "variants": [
    "润色版本1（专业精炼）",
    "润色版本2（量化/结果导向）",
    "润色版本3（生动有感染力）"
  ]
}}
"""


async def polish_text(text: str, section_type: str = "", field: str = "") -> List[str]:
    """
    对简历文本进行 AI 润色，返回 3 个版本。
    """
    prompt = POLISH_USER_TEMPLATE.format(text=text)

    if section_type:
        prompt += f"\n\n上下文：这是简历中「{section_type}」部分的「{field or '文本'}」字段。"

    try:
        full_text, usage = await run_claude_text(
            system_prompt=POLISH_SYSTEM_PROMPT,
            user_prompt=prompt,
        )
    except Exception as e:
        logger.error(f"polish_text Claude 调用失败: {e}")
        raise RuntimeError("AI 润色服务暂时不可用，请稍后重试")

    try:
        parsed = json.loads(full_text)
    except json.JSONDecodeError:
        # try to extract JSON from markdown code blocks
        import re
        match = re.search(r'\{[\s\S]*\}', full_text)
        if match:
            try:
                parsed = json.loads(match.group())
            except json.JSONDecodeError:
                raise RuntimeError("AI 返回格式异常，请重试")
        else:
            raise RuntimeError("AI 返回格式异常，请重试")

    variants = parsed.get("variants", [])
    if not isinstance(variants, list) or len(variants) == 0:
        raise RuntimeError("AI 返回内容为空，请重试")

    return variants[:3]
