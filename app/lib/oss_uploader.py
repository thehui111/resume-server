import os
import time

import oss2

from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

_ALLOWED_EXTS = {"jpg", "jpeg", "png", "webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5 MB


def _get_bucket() -> oss2.Bucket:
    access_key_id = os.getenv("ALIYUN_ACCESS_KEY_ID", "")
    access_key_secret = os.getenv("ALIYUN_ACCESS_KEY_SECRET", "")
    bucket_name = os.getenv("ALIYUN_OSS_BUCKET", "")
    endpoint = os.getenv("ALIYUN_OSS_ENDPOINT", "")
    if not all([access_key_id, access_key_secret, bucket_name, endpoint]):
        raise RuntimeError("OSS 配置不完整，请检查 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET / ALIYUN_OSS_BUCKET / ALIYUN_OSS_ENDPOINT")
    auth = oss2.Auth(access_key_id, access_key_secret)
    return oss2.Bucket(auth, endpoint, bucket_name)


def upload_image(image_data: bytes, ext: str, user_id: str) -> str:
    """
    上传图片字节到阿里云 OSS。

    Args:
        image_data: 图片原始字节
        ext: 文件扩展名（不含点，如 "jpg"）
        user_id: 上传用户 ID，用于隔离目录

    Returns:
        可访问的公网 URL
    """
    ext = ext.lower().lstrip(".")
    if ext not in _ALLOWED_EXTS:
        raise ValueError(f"不支持的图片格式: {ext}，允许: {', '.join(_ALLOWED_EXTS)}")
    if len(image_data) > _MAX_SIZE:
        raise ValueError(f"图片超过 5MB 限制")

    bucket = _get_bucket()
    file_key = f"resume-avatars/{user_id}/{int(time.time())}.{ext}"

    result = bucket.put_object(file_key, image_data)
    if result.status != 200:
        raise RuntimeError(f"OSS 上传失败，HTTP {result.status}")

    endpoint = os.getenv("ALIYUN_OSS_ENDPOINT", "").replace("https://", "").replace("http://", "").replace("-internal", "")
    bucket_name = os.getenv("ALIYUN_OSS_BUCKET", "")
    url = f"https://{bucket_name}.{endpoint}/{file_key}"
    logger.info(f"[oss] 图片上传成功: {url}")
    return url
