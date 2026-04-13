import os
import traceback
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.db.user.user_service import User
from app.lib.oss_uploader import download_and_upload_to_oss
from app.model.api_response import ApiResponse
from app.service.ai.image_service import image_service
from app.utils.error_codes import ErrorCode
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

router = APIRouter(prefix="/image", tags=["image"])


# ── 请求模型 ──────────────────────────────────────────────────────────────
class BananaGenerateReq(BaseModel):
    text: str = Field(..., min_length=1, description="图片生成提示词")
    image_urls: Optional[List[str]] = Field(default=None, description="参考图片 URL 列表")
    aspect_ratio: Optional[str] = Field(default=None, description="画面比例，如 VIDEO_ASPECT_RATIO_LANDSCAPE")
    image_size: str = Field(default="1K", description="图片大小，1K/2K/4K，仅在 use_pro_model=True 时生效")
    use_pro_model: bool = Field(default=False, description="是否使用 nano banana pro 模型")
    model_name: Optional[str] = Field(default=None, description="指定模型名称，如 gemini-3.1-flash-image-preview")


class SeedreamGenerateReq(BaseModel):
    prompt: str = Field(..., min_length=1, description="图片生成提示词")
    model: str = Field(default="seedream-5-0-260128", description="Seedream 模型版本，如 seedream-5-0-260128 / seedream-5-0")
    image_urls: Optional[List[str]] = Field(default=None, description="参考图片 URL 列表")
    size: str = Field(default="2k", description="图片尺寸，如 2k / 3k")
    seed: Optional[int] = Field(default=None, description="随机种子")


class EditImageReq(BaseModel):
    prompt: str = Field(..., min_length=1, description="编辑提示词，描述想如何修改图片")
    image_url: str = Field(..., min_length=10, description="待编辑的图片 URL")
    aspect_ratio: Optional[str] = Field(default="VIDEO_ASPECT_RATIO_LANDSCAPE", description="画面比例")


# ── 响应模型 ──────────────────────────────────────────────────────────────
class ImageResp(BaseModel):
    image_url: str = Field(description="生成的图片 URL")


# ── 工具函数 ──────────────────────────────────────────────────────────────
def _extract_image_url(result: Any) -> str:
    """从各种返回格式中提取图片 URL"""
    if isinstance(result, dict):
        # banana 格式
        if result.get("image_url"):
            return result["image_url"]
        # seedream 格式: {"images": [{"url": "..."}]}
        images = result.get("images")
        if images and isinstance(images, list) and images[0].get("url"):
            return images[0]["url"]
        # 兜底 direct url
        if result.get("url"):
            return result["url"]
    if isinstance(result, str):
        return result
    return ""


# ── 接口 ──────────────────────────────────────────────────────────────────
@router.post("/banana/generate", response_model=ApiResponse, summary="Banana 生图")
async def banana_generate(
    req: BananaGenerateReq,
    current_user: User = Depends(get_current_user),
):
    """
    调用 video-base-v2 Banana 接口生成图片。

    Input:
        - text (str, required): 提示词
        - image_urls (list[str], optional): 参考图片
        - aspect_ratio (str, optional): 画面比例
        - image_size (str, optional): 1K/2K/4K
        - use_pro_model (bool, optional): 是否用 pro 模型
        - model_name (str, optional): 模型名

    Output:
        - image_url (str): 生成图片的 OSS 永久链接
    """
    if not os.getenv("VIDEO_BASE_URL"):
        return ApiResponse.fail(
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.code,
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.message,
        )

    try:
        result = await image_service.banana_generate_image(
            text=req.text,
            image_urls=req.image_urls,
            aspect_ratio=req.aspect_ratio,
            image_size=req.image_size,
            use_pro_model=req.use_pro_model,
            model_name=req.model_name,
        )
    except Exception as e:
        logger.error(f"Banana 生图失败: {e}\n{traceback.format_exc()}")
        return ApiResponse.fail(
            ErrorCode.BANANA_GENERATE_FAILED.code,
            f"{ErrorCode.BANANA_GENERATE_FAILED.message}: {str(e)}",
        )

    image_url = _extract_image_url(result)
    if not image_url:
        return ApiResponse.fail(
            ErrorCode.BANANA_GENERATE_EMPTY.code,
            ErrorCode.BANANA_GENERATE_EMPTY.message,
        )

    try:
        oss_url = await download_and_upload_to_oss(image_url, current_user.user_id)
    except Exception as e:
        logger.warning(f"Banana 生图 OSS 转存失败，返回原始 URL: {e}")
        oss_url = image_url

    return ApiResponse.ok(data=ImageResp(image_url=oss_url))


@router.post("/seedream/generate", response_model=ApiResponse, summary="Seedream 生图")
async def seedream_generate(
    req: SeedreamGenerateReq,
    current_user: User = Depends(get_current_user),
):
    """
    调用 Seedream 接口生成图片。

    Input:
        - prompt (str, required): 提示词
        - model (str, optional): 模型版本
        - image_urls (list[str], optional): 参考图片
        - size (str, optional): 尺寸
        - seed (int, optional): 随机种子

    Output:
        - image_url (str): 生成图片的 OSS 永久链接
    """
    if not os.getenv("VIDEO_BASE_URL"):
        return ApiResponse.fail(
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.code,
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.message,
        )

    try:
        result = await image_service.seedream_generate_image(
            prompt=req.prompt,
            model=req.model,
            image_urls=req.image_urls,
            size=req.size,
            seed=req.seed,
        )
    except Exception as e:
        logger.error(f"Seedream 生图失败: {e}\n{traceback.format_exc()}")
        return ApiResponse.fail(
            ErrorCode.SEEDREAM_GENERATE_FAILED.code,
            f"{ErrorCode.SEEDREAM_GENERATE_FAILED.message}: {str(e)}",
        )

    image_url = _extract_image_url(result)
    if not image_url:
        return ApiResponse.fail(
            ErrorCode.SEEDREAM_GENERATE_EMPTY.code,
            ErrorCode.SEEDREAM_GENERATE_EMPTY.message,
        )

    try:
        oss_url = await download_and_upload_to_oss(image_url, current_user.user_id)
    except Exception as e:
        logger.warning(f"Seedream 生图 OSS 转存失败，返回原始 URL: {e}")
        oss_url = image_url

    return ApiResponse.ok(data=ImageResp(image_url=oss_url))


@router.post("/edit", response_model=ApiResponse, summary="通用图片编辑（基于 prompt）")
async def edit_image(
    req: EditImageReq,
    current_user: User = Depends(get_current_user),
):
    """
    调用 video-base-v4 图像编辑接口，通过 prompt 修改已有图片。
    底层不区分模型，支持通过 prompt 对任意图片进行编辑。

    Input:
        - prompt (str, required): 编辑指令，如 "把背景换成雪山"
        - image_url (str, required): 待编辑图片 URL
        - aspect_ratio (str, optional): 画面比例

    Output:
        - image_url (str): 编辑后的图片 OSS 永久链接
    """
    if not os.getenv("VIDEO_BASE_URL"):
        return ApiResponse.fail(
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.code,
            ErrorCode.IMAGE_SERVICE_NOT_CONFIGURED.message,
        )

    try:
        result = await image_service.edit_image(
            prompt=req.prompt,
            image_urls=[req.image_url],
            aspect_ratio=req.aspect_ratio,
        )
    except Exception as e:
        logger.error(f"图片编辑失败: {e}\n{traceback.format_exc()}")
        return ApiResponse.fail(
            ErrorCode.IMAGE_EDIT_FAILED.code,
            f"{ErrorCode.IMAGE_EDIT_FAILED.message}: {str(e)}",
        )

    image_url = _extract_image_url(result)
    if not image_url:
        return ApiResponse.fail(
            ErrorCode.IMAGE_EDIT_EMPTY.code,
            ErrorCode.IMAGE_EDIT_EMPTY.message,
        )

    try:
        oss_url = await download_and_upload_to_oss(image_url, current_user.user_id)
    except Exception as e:
        logger.warning(f"图片编辑 OSS 转存失败，返回原始 URL: {e}")
        oss_url = image_url

    return ApiResponse.ok(data=ImageResp(image_url=oss_url))
