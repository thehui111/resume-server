import asyncio
import os
import traceback
from typing import Dict, Any, List, Optional

import httpx
import pydash

from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

WAVESPEED_API_KEY = os.getenv("WAVESPEED_API_KEY", "")
WAVESPEED_EDIT_URL = "https://api.wavespeed.ai/api/v3/wavespeed-ai/qwen-image/edit-plus"
WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions"

_DEFAULT_TIMEOUT = httpx.Timeout(connect=20.0, read=120.0, write=60.0, pool=10.0)
_MAX_RETRIES = 3
_RETRY_DELAY = 3


class AvatarService:
    """头像优化与背景修改服务，底层调用 WaveSpeed qwen-image/edit-plus API"""

    async def _call_edit_api(
        self,
        prompt: str,
        images: List[str],
        size: str = "1024*1024",
    ) -> Dict[str, Any]:
        """调用 WaveSpeed 图像编辑 API（同步模式）"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {WAVESPEED_API_KEY}",
        }
        data = {
            "enable_base64_output": False,
            "enable_sync_mode": True,
            "images": images,
            "output_format": "jpeg",
            "size": size,
            "prompt": prompt,
            "seed": -1,
        }

        for attempt in range(_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                    logger.info(f"WaveSpeed edit API call: prompt={prompt}, images={images}")
                    res = await client.post(WAVESPEED_EDIT_URL, headers=headers, json=data)
                    logger.info(f"WaveSpeed edit API response: status={res.status_code}")
                    if res.status_code != 200:
                        raise Exception(
                            f"WaveSpeed edit API failed, status={res.status_code}, body={res.text}"
                        )
                    resp = res.json()
                    image_url = pydash.get(resp, "data.outputs[0]", "")
                    if not image_url:
                        # 同步模式可能返回 request_id，需要轮询
                        request_id = pydash.get(resp, "data.id")
                        if request_id:
                            image_url = await self._poll_result(request_id)
                    return {"image_url": image_url}
            except Exception as e:
                logger.warning(
                    f"WaveSpeed edit API attempt {attempt + 1}/{_MAX_RETRIES} failed: {e}"
                )
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(_RETRY_DELAY)
                else:
                    raise

    async def _poll_result(self, request_id: str, max_wait: int = 120) -> str:
        """轮询异步任务结果"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {WAVESPEED_API_KEY}",
        }
        elapsed = 0
        interval = 5
        async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
            while elapsed < max_wait:
                await asyncio.sleep(interval)
                elapsed += interval
                url = f"{WAVESPEED_RESULT_URL}/{request_id}/result"
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    continue
                resp = res.json()
                status = pydash.get(resp, "data.status", "")
                if status in ("completed", "success"):
                    image_url = pydash.get(resp, "data.outputs[0]", "")
                    if image_url:
                        return image_url
                if status == "failed":
                    error = pydash.get(resp, "data.error", "unknown error")
                    raise Exception(f"WaveSpeed task failed: {error}")
        raise Exception(f"WaveSpeed task timeout after {max_wait}s")

    async def optimize_avatar(self, image_url: str) -> str:
        """优化用户头像（画质增强、专业风格）"""
        prompt = (
            "Enhance this portrait photo to be more professional and high-quality. "
            "Improve skin texture, lighting, and clarity while keeping the person's facial features unchanged. "
            "Make it suitable for a professional resume or business profile."
        )
        result = await self._call_edit_api(prompt=prompt, images=[image_url])
        return result["image_url"]

    async def change_background(
        self,
        image_url: str,
        background_color: str,
    ) -> str:
        """修改头像背景色"""
        prompt = (
            f"Change the background of this portrait photo to a solid {background_color} color. "
            "Keep the person exactly as they are, only replace the background. "
            "Ensure clean edges around the person with no artifacts."
        )
        result = await self._call_edit_api(prompt=prompt, images=[image_url])
        return result["image_url"]


avatar_service = AvatarService()
