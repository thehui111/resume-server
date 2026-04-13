import asyncio

import openai

from app.config.llm_provider_config import LLMProviderConfig
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

_MAX_RETRIES = 3
_RETRY_DELAY = 2.0  # 秒，每次翻倍

_DEFAULT_MODEL = "gemini-2.5-pro"


async def run_gemini_text(
    system_prompt: str,
    user_prompt: str,
    model: str = _DEFAULT_MODEL,
) -> tuple[str, dict]:
    """
    异步调用 Gemini（通过 DB 动态配置的 OpenAI-compatible 代理），返回完整文本响应。

    Returns:
        (full_text, usage)
        usage: {"input_tokens": int, "output_tokens": int}
    """
    logger.info(f"[gemini] 开始调用 model={model}, prompt_len={len(user_prompt)}")

    providers = LLMProviderConfig.get_price_sorted_providers()
    if not providers:
        raise RuntimeError("AI 服务未配置，请联系管理员")

    last_exc: Exception | None = None

    for provider_name in providers:
        config = LLMProviderConfig.get_provider_config(provider_name)
        if not config.is_configured():
            logger.warning(f"[gemini] provider={provider_name} 未配置，跳过")
            continue

        model_name = LLMProviderConfig.normalize_model_name(model, provider_name)
        client = openai.AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.api_base or None,
        )

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = await client.chat.completions.create(
                    model=model_name,
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
                logger.info(
                    f"[gemini] 完成 | provider={provider_name} model={model_name} "
                    f"input={usage['input_tokens']} output={usage['output_tokens']}"
                )
                return full_text, usage
            except (openai.RateLimitError, openai.APIStatusError) as e:
                last_exc = e
                if attempt < _MAX_RETRIES:
                    delay = _RETRY_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        f"[gemini] provider={provider_name} 第{attempt}次失败，{delay:.0f}s 后重试: {e}"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"[gemini] provider={provider_name} 重试{_MAX_RETRIES}次均失败: {e}")
            except Exception:
                raise

    if isinstance(last_exc, openai.RateLimitError):
        raise RuntimeError("AI 服务繁忙，请稍后重试")
    raise RuntimeError("AI 服务暂时不可用，请稍后重试")
