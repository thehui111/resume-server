from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, Text
from sqlmodel import SQLModel, Field, Session, select

from app.db.database import engine
from app.lib.datetime_utils import now_cst
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)


# ── 表模型 ────────────────────────────────────────────────────────────────
class ResumeTemplate(SQLModel, table=True):
    __tablename__ = "resume_template"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    thumbnail_url: Optional[str] = Field(default=None, max_length=512)
    # HTML/CSS 模板，Jinja2 语法，变量为 sections dict
    html_template: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_premium: bool = Field(default=False)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)


# ── Service ───────────────────────────────────────────────────────────────
class TemplateService:

    def get_by_id(self, template_id: int) -> Optional[ResumeTemplate]:
        with Session(engine) as session:
            return session.exec(
                select(ResumeTemplate).where(ResumeTemplate.id == template_id)
            ).first()

    def list_all(self) -> List[ResumeTemplate]:
        with Session(engine) as session:
            return list(session.exec(select(ResumeTemplate)).all())

    def create(
        self,
        name: str,
        html_template: str,
        thumbnail_url: Optional[str] = None,
        is_premium: bool = False,
    ) -> ResumeTemplate:
        with Session(engine) as session:
            tpl = ResumeTemplate(
                name=name,
                html_template=html_template,
                thumbnail_url=thumbnail_url,
                is_premium=is_premium,
            )
            session.add(tpl)
            session.commit()
            session.refresh(tpl)
            return tpl


template_service = TemplateService()
