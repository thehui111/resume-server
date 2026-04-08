import asyncio
import os

import openai

from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

_MAX_RETRIES = int(os.getenv("CLAUDE_MAX_RETRIES", "3"))
_RETRY_DELAY = float(os.getenv("CLAUDE_RETRY_DELAY", "2"))  # 秒，每次翻倍

_base_url = os.getenv("CLAUDE_BASE_URL") or os.getenv("ANTHROPIC_BASE_URL") or ""
# 代理要求路径为 /v1/chat/completions，base_url 需以 /v1 结尾
if _base_url and not _base_url.rstrip("/").endswith("/v1"):
    _base_url = _base_url.rstrip("/") + "/v1"

_client = openai.AsyncOpenAI(
    # 代理用 CLAUDE_AUTH_TOKEN 作为 Bearer token，与 smartvideo 保持一致
    api_key=os.getenv("CLAUDE_AUTH_TOKEN") or os.getenv("ANTHROPIC_AUTH_TOKEN")
          or os.getenv("ANTHROPIC_API_KEY") or "dummy",
    base_url=_base_url or None,
)

_DEFAULT_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")


async def run_claude_text(
    system_prompt: str,
    user_prompt: str,
    model: str = _DEFAULT_MODEL,
) -> tuple[str, dict]:
    """
    异步调用 Claude（通过 OpenAI-compatible 代理），返回完整文本响应。

    Returns:
        (full_text, usage)
        usage: {"input_tokens": int, "output_tokens": int}
    """
    logger.info(f"[claude] 开始调用 model={model}, prompt_len={len(user_prompt)}")

    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = await _client.chat.completions.create(
                model=model,
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            full_text = response.choices[0].message.content or ""
            usage = {
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0,
            }
            logger.info(f"[claude] 完成 | input={usage['input_tokens']} output={usage['output_tokens']}")
            return full_text, usage
        except (openai.RateLimitError, openai.APIStatusError) as e:
            last_exc = e
            if attempt < _MAX_RETRIES:
                delay = _RETRY_DELAY * (2 ** (attempt - 1))
                logger.warning(f"[claude] 第{attempt}次失败，{delay:.0f}s 后重试: {e}")
                await asyncio.sleep(delay)
            else:
                logger.error(f"[claude] 重试{_MAX_RETRIES}次均失败: {e}")
        except Exception as e:
            raise

    # 将原始 API 异常转成用户友好消息，避免把 Sentry / 内部诊断信息透传给前端
    if isinstance(last_exc, openai.RateLimitError):
        raise RuntimeError("AI 服务繁忙，请稍后重试")
    raise RuntimeError("AI 服务暂时不可用，请稍后重试")
