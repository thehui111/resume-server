import asyncio
import os
import traceback
from typing import Any, Dict, List, Optional

import httpx

from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

VIDEO_BASE_URL = os.getenv("VIDEO_BASE_URL", "https://vb.movieflow.ai")
BANANA_GENERATE_URL = f"{VIDEO_BASE_URL}/video-base-v2/generate-image-v2"
SEEDREAM_GENERATE_URL = f"{VIDEO_BASE_URL}/seedream/generate-images"
IMAGE_EDIT_URL = f"{VIDEO_BASE_URL}/video-base-v4/image-edit"

_DEFAULT_TIMEOUT = httpx.Timeout(connect=120.0, read=320.0, pool=20.0, write=120.0)
_MAX_RETRIES = 3
_RETRY_DELAY = 2


class ImageService:
    """图片生成服务，封装 Banana（video-base-v2）、Seedream 生图和通用图像编辑接口"""

    async def edit_image(
        self,
        prompt: str,
        image_urls: List[str],
        aspect_ratio: Optional[str] = "VIDEO_ASPECT_RATIO_LANDSCAPE",
    ) -> Dict[str, Any]:
        """调用 video-base-v4 /image-edit 通用图像编辑接口"""
        headers = {"Content-Type": "application/json"}
        if aspect_ratio == "VIDEO_ASPECT_RATIO_LANDSCAPE":
            size = "1664*928"
        elif aspect_ratio == "VIDEO_ASPECT_RATIO_PORTRAIT":
            size = "928*1664"
        elif aspect_ratio == "VIDEO_ASPECT_RATIO_SQUARE":
            size = "1024*1024"
        else:
            size = "1664*928"
        data = {
            "prompt": prompt,
            "images": [url for url in image_urls if url and url.startswith(("http://", "https://"))],
            "size": size,
        }
        logger.info(f"edit_image start: prompt={prompt[:80]}..., images={image_urls}")
        last_exception = None
        for attempt in range(_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                    res = await client.post(IMAGE_EDIT_URL, headers=headers, json=data)
                    logger.info(f"edit_image response: status={res.status_code}, text={res.text[:500]}")
                    if res.status_code != 200:
                        raise Exception(f"edit_image HTTP error: {res.status_code}, body: {res.text}")
                    result = res.json()
                    # 兼容不同返回格式
                    image_url = result.get("image_url") if isinstance(result, dict) else ""
                    if not image_url and isinstance(result, dict) and "data" in result:
                        image_url = result["data"].get("image_url", "")
                    return {"image_url": image_url, "raw": result}
            except Exception as e:
                last_exception = e
                logger.warning(f"edit_image attempt {attempt + 1}/{_MAX_RETRIES} failed: {e}")
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(_RETRY_DELAY)
        raise Exception(f"edit_image failed after {_MAX_RETRIES} retries: {last_exception}")

    async def banana_generate_image(
        self,
        text: str,
        image_urls: Optional[List[str]] = None,
        aspect_ratio: Optional[str] = None,
        image_size: str = "1K",
        use_pro_model: bool = False,
        model_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """调用 video-base-v2 /generate-image-v2（Banana 生图）"""
        payload: Dict[str, Any] = {
            "text": text,
            "image_urls": [url for url in (image_urls or []) if url and url.startswith(("http://", "https://"))],
            "aspect_ratio": aspect_ratio,
            "image_size": image_size,
            "use_pro_model": use_pro_model,
            "model_name": model_name,
        }
        logger.info(f"banana_generate_image start: text={text[:80]}..., payload={payload}")

        last_exception = None
        for attempt in range(_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                    res = await client.post(BANANA_GENERATE_URL, json=payload)
                    logger.info(
                        f"banana_generate_image response: status={res.status_code}, text={res.text[:200]}"
                    )
                    res.raise_for_status()
                    result = res.json()
                    data = result.get("data", {})
                    if isinstance(data, dict) and data.get("image_url"):
                        return {"image_url": data["image_url"], "text": data.get("text", "")}
                    # 兼容直接返回 image_url 的场景
                    if isinstance(data, str):
                        return {"image_url": data, "text": ""}
                    return {"image_url": "", "text": "", "raw": result}
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"banana_generate_image attempt {attempt + 1}/{_MAX_RETRIES} failed: {e}"
                )
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(_RETRY_DELAY)

        error_msg = f"banana_generate_image failed after {_MAX_RETRIES} retries"
        if last_exception:
            error_msg += f": {last_exception}"
        raise Exception(error_msg)

    async def seedream_generate_image(
        self,
        prompt: str,
        model: str = "seedream-5-0-260128",
        image_urls: Optional[List[str]] = None,
        size: str = "2k",
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """调用 Seedream /generate-images"""
        headers = {"Content-Type": "application/json"}
        data: Dict[str, Any] = {
            "prompt": prompt,
            "model": model,
            "image_urls": image_urls or [],
            "sequential_image_generation": "disabled",
            "sequential_image_generation_options": {},
            "size": size,
        }
        if seed is not None:
            data["seed"] = seed

        logger.info(f"seedream_generate_image start: model={model}, size={size}")
        last_exception = None
        last_traceback_str = None
        for attempt in range(_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                    res = await client.post(SEEDREAM_GENERATE_URL, headers=headers, json=data)
                    logger.info(
                        f"seedream_generate_image response: status={res.status_code}, text={res.text[:200]}"
                    )
                    if res.status_code != 200:
                        raise Exception(
                            f"seedream_generate_images HTTP error: {res.status_code}, response: {res.text}"
                        )
                    result = res.json()
                    if isinstance(result, dict) and result.get("code") not in (None, 0):
                        error_msg = result.get("message", "Unknown error")
                        raise Exception(f"seedream_generate_images API error: {error_msg}")
                    data_result = result.get("data", result) if isinstance(result, dict) else result
                    # seedream 通常返回的是 dict 包含 images 列表
                    return data_result
            except Exception as e:
                last_exception = e
                last_traceback_str = traceback.format_exc()
                logger.error(
                    f"seedream_generate_image attempt {attempt + 1}/{_MAX_RETRIES} failed: {e}"
                )
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(_RETRY_DELAY)

        error_msg = "seedream_generate_image failed after 3 retries"
        if last_exception and last_traceback_str:
            error_msg += f"\nLast exception: {last_exception}\n{last_traceback_str}"
        raise Exception(error_msg) from last_exception


image_service = ImageService()
