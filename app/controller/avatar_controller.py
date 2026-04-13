import os
import traceback

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.db.user.user_service import User
from app.lib.oss_uploader import download_and_upload_to_oss
from app.model.api_response import ApiResponse
from app.service.ai.avatar_service import avatar_service
from app.utils.error_codes import ErrorCode
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

router = APIRouter(prefix="/avatar", tags=["avatar"])


# ── 请求模型 ──────────────────────────────────────────────────────────────
class OptimizeAvatarReq(BaseModel):
    image_url: str = Field(..., min_length=10, description="原始头像图片 URL")


class ChangeBackgroundReq(BaseModel):
    image_url: str = Field(..., min_length=10, description="原始头像图片 URL")
    background_color: str = Field(
        ..., min_length=1, max_length=100,
        description="目标背景色，如 white、lightblue，或十六进制色值如 #FF5733",
    )


# ── 响应模型 ──────────────────────────────────────────────────────────────
class AvatarResp(BaseModel):
    image_url: str = Field(description="处理后的头像图片 URL")


# ── 接口 ──────────────────────────────────────────────────────────────────
@router.post("/optimize", response_model=ApiResponse, summary="AI 优化头像")
async def optimize_avatar(
    req: OptimizeAvatarReq,
    current_user: User = Depends(get_current_user),
):
    """
    AI 优化用户头像：增强画质、改善光照、使其更专业。

    Input:
        - image_url (str, required): 原始头像图片 URL

    Output:
        - image_url (str): 优化后的头像图片 URL（已上传至 OSS）
    """
    if not os.getenv("WAVESPEED_API_KEY"):
        return ApiResponse.fail(ErrorCode.AVATAR_SERVICE_NOT_CONFIGURED.code, ErrorCode.AVATAR_SERVICE_NOT_CONFIGURED.message)

    try:
        result_url = await avatar_service.optimize_avatar(req.image_url)
    except Exception as e:
        logger.error(f"头像优化失败: {e}\n{traceback.format_exc()}")
        return ApiResponse.fail(ErrorCode.AVATAR_OPTIMIZE_FAILED.code, f"{ErrorCode.AVATAR_OPTIMIZE_FAILED.message}: {str(e)}")

    if not result_url:
        return ApiResponse.fail(ErrorCode.AVATAR_OPTIMIZE_EMPTY.code, ErrorCode.AVATAR_OPTIMIZE_EMPTY.message)

    # 转存到自有 OSS
    try:
        oss_url = await download_and_upload_to_oss(result_url, current_user.user_id)
    except Exception as e:
        logger.warning(f"优化头像 OSS 上传失败，返回原始 URL: {e}")
        oss_url = result_url

    return ApiResponse.ok(data=AvatarResp(image_url=oss_url))


@router.post("/change-background", response_model=ApiResponse, summary="修改头像背景色")
async def change_background(
    req: ChangeBackgroundReq,
    current_user: User = Depends(get_current_user),
):
    """
    AI 修改用户头像背景色。

    Input:
        - image_url (str, required): 原始头像图片 URL
        - background_color (str, required): 目标背景色，如 white、lightblue、#FF5733

    Output:
        - image_url (str): 修改背景后的头像图片 URL（已上传至 OSS）
    """
    if not os.getenv("WAVESPEED_API_KEY"):
        return ApiResponse.fail(ErrorCode.AVATAR_SERVICE_NOT_CONFIGURED.code, ErrorCode.AVATAR_SERVICE_NOT_CONFIGURED.message)

    try:
        result_url = await avatar_service.change_background(
            image_url=req.image_url,
            background_color=req.background_color,
        )
    except Exception as e:
        logger.error(f"头像背景修改失败: {e}\n{traceback.format_exc()}")
        return ApiResponse.fail(ErrorCode.AVATAR_BG_CHANGE_FAILED.code, f"{ErrorCode.AVATAR_BG_CHANGE_FAILED.message}: {str(e)}")

    if not result_url:
        return ApiResponse.fail(ErrorCode.AVATAR_BG_CHANGE_EMPTY.code, ErrorCode.AVATAR_BG_CHANGE_EMPTY.message)

    # 转存到自有 OSS
    try:
        oss_url = await download_and_upload_to_oss(result_url, current_user.user_id)
    except Exception as e:
        logger.warning(f"背景修改头像 OSS 上传失败，返回原始 URL: {e}")
        oss_url = result_url

    return ApiResponse.ok(data=AvatarResp(image_url=oss_url))
