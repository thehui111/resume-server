from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Set

from sqlmodel import SQLModel, Field, Session, select, func

from app.db.database import BaseResp, Page, engine
from app.lib.datetime_utils import now_cst
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)


class ServerSetting(SQLModel, table=True):
    __tablename__ = "server_setting"

    id: Optional[int] = Field(default=None, primary_key=True)
    server_name: str = Field(default="smartvideo", nullable=True)
    code: str = Field(index=True, nullable=False)
    value: str = Field(nullable=False)
    note: str = Field(nullable=False)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)
    updated_at: datetime = Field(nullable=False, default_factory=now_cst)
    start_time: Optional[datetime] = Field(default=None, nullable=True)
    end_time: Optional[datetime] = Field(default=None, nullable=True)
    ext: Optional[str] = Field(default=None, nullable=True)

    class Config:
        from_attributes = True


class ListServerSettingReq(BaseResp):
    server_name: Optional[str] = None
    codes: Optional[Set[str]] = None
    code_like: Optional[str] = None
    ids: Optional[Set[int]] = None
    created_before: Optional[datetime] = None
    created_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None


class UpdateByCodeServerSettingReq(BaseResp):
    server_name: str = Field(default="smartvideo", nullable=True)
    code: str = Field(..., min_length=1, description="Code cannot be empty")
    value: str = Field(..., min_length=1, description="Value cannot be empty")
    note: str = Field(..., min_length=1, description="Note cannot be empty")


class ServerSettingService:

    def list(self, req: ListServerSettingReq) -> List[ServerSetting]:
        query = select(ServerSetting)
        query = self._apply_filters(query, req)
        with Session(engine) as session:
            return list(session.exec(query).all())

    def get_by_code(self, code: str) -> Optional[ServerSetting]:
        with Session(engine) as session:
            return session.exec(
                select(ServerSetting).where(ServerSetting.code == code)
            ).first()

    def update_by_code(self, req: UpdateByCodeServerSettingReq) -> Optional[ServerSetting]:
        with Session(engine) as session:
            item = session.exec(
                select(ServerSetting).where(ServerSetting.code == req.code)
            ).first()
            if not item:
                logger.warning(f"设置code {req.code} 不存在")
                return None
            item.value = req.value
            item.note = req.note
            item.updated_at = now_cst()
            session.commit()
            session.refresh(item)
            return item

    def _apply_filters(self, query, req):
        if hasattr(req, "server_name") and req.server_name:
            query = query.where(ServerSetting.server_name == req.server_name)
        if hasattr(req, "codes") and req.codes:
            query = query.where(ServerSetting.code.in_(req.codes))
        if hasattr(req, "code_like") and req.code_like:
            query = query.where(ServerSetting.code.like(f"%{req.code_like}%"))
        if hasattr(req, "ids") and req.ids:
            query = query.where(ServerSetting.id.in_(req.ids))
        if hasattr(req, "created_before") and req.created_before:
            query = query.where(ServerSetting.created_at < req.created_before)
        if hasattr(req, "created_after") and req.created_after:
            query = query.where(ServerSetting.created_at > req.created_after)
        if hasattr(req, "updated_before") and req.updated_before:
            query = query.where(ServerSetting.updated_at < req.updated_before)
        if hasattr(req, "updated_after") and req.updated_after:
            query = query.where(ServerSetting.updated_at > req.updated_after)
        return query
