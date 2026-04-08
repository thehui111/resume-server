from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Tuple

from sqlmodel import SQLModel, Field, Session, select, func

from app.db.database import engine
from app.lib.datetime_utils import now_cst
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)


# ── 表模型 ────────────────────────────────────────────────────────────────
class Resume(SQLModel, table=True):
    __tablename__ = "resume"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, max_length=32)
    title: str = Field(max_length=255, default="未命名简历")
    template_id: Optional[int] = Field(default=None, index=True)
    # draft / published
    status: str = Field(max_length=20, default="draft")
    target_role: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)
    updated_at: datetime = Field(nullable=False, default_factory=now_cst)


# ── Service ───────────────────────────────────────────────────────────────
class ResumeService:

    def create(self, user_id: str, title: str = "未命名简历", target_role: Optional[str] = None) -> Resume:
        with Session(engine) as session:
            resume = Resume(user_id=user_id, title=title, target_role=target_role)
            session.add(resume)
            session.commit()
            session.refresh(resume)
            return resume

    def get_by_id(self, resume_id: int) -> Optional[Resume]:
        with Session(engine) as session:
            return session.exec(
                select(Resume).where(Resume.id == resume_id)
            ).first()

    def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20) -> Tuple[List[Resume], int]:
        with Session(engine) as session:
            query = select(Resume).where(Resume.user_id == user_id).order_by(Resume.updated_at.desc())
            total = session.exec(
                select(func.count()).select_from(query.subquery())
            ).one()
            items = session.exec(
                query.offset((page - 1) * page_size).limit(page_size)
            ).all()
            return list(items), total

    def update(
        self,
        resume_id: int,
        title: Optional[str] = None,
        template_id: Optional[int] = None,
        target_role: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Optional[Resume]:
        with Session(engine) as session:
            resume = session.exec(
                select(Resume).where(Resume.id == resume_id)
            ).first()
            if not resume:
                return None
            if title is not None:
                resume.title = title
            if template_id is not None:
                resume.template_id = template_id
            if target_role is not None:
                resume.target_role = target_role
            if status is not None:
                resume.status = status
            resume.updated_at = now_cst()
            session.add(resume)
            session.commit()
            session.refresh(resume)
            return resume

    def delete(self, resume_id: int) -> None:
        with Session(engine) as session:
            resume = session.exec(
                select(Resume).where(Resume.id == resume_id)
            ).first()
            if resume:
                session.delete(resume)
                session.commit()


resume_service = ResumeService()
