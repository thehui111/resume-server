from fastapi import HTTPException
from app.db.serversetting.serversetting_service import ListServerSettingReq, ServerSetting, ServerSettingService, UpdateByCodeServerSettingReq
from redis import Redis
from typing import Optional, List
from cachetools import TTLCache, cached
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

"""
缓存服务器设置值

APP_CONFIG.v("aaa", "1") # 返回字符串
"""


class CachedServiceSettingService:
    local_cache = TTLCache(maxsize=100, ttl=120)

    @cached(cache=local_cache)
    def get_all_server_settings(self) -> List[ServerSetting]:
        service = ServerSettingService()
        return service.list(ListServerSettingReq(server_name="studio"))

    def clear_cache(self):
        self.local_cache.clear()

    def get_cached_service_setting(self, code: str) -> Optional[ServerSetting]:
        all_server_settings = self.get_all_server_settings()
        return next(filter(lambda x: x.code == code, all_server_settings), None)


service = CachedServiceSettingService()


class APP_CONFIG:
    @classmethod
    def list(cls) -> List[ServerSetting]:
        return service.get_all_server_settings()

    @classmethod
    def clear_cache(cls):
        service.clear_cache()

    @classmethod
    def set_v(cls, code: str, value: str):
        service.update_by_code(
            UpdateByCodeServerSettingReq(
                **{
                    "code": code,
                    "server_name": "studio",
                    "value": value,
                    "note": "set by code",
                }
            )
        )

    @classmethod
    def v(cls, code: str, default: str = None) -> Optional[str]:
        value = service.get_cached_service_setting(code)
        if value is None:
            return default
        return value.value

    @classmethod
    def get_int_v(cls, code: str, default: int = 0) -> int:
        value = cls.v(code, str(default))
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
