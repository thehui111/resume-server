from __future__ import annotations

import json
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import Text
from sqlmodel import SQLModel, Field, Session, select, Column

from app.db.database import engine
from app.lib.datetime_utils import now_cst
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

# section_type 枚举值
SECTION_TYPES = {"basic_info", "work_exp", "education", "skills", "projects", "summary"}


# ── 表模型 ────────────────────────────────────────────────────────────────
class ResumeSection(SQLModel, table=True):
    __tablename__ = "resume_section"

    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(index=True)
    section_type: str = Field(max_length=50, index=True)
    # JSON 字符串，按 section_type 有不同结构
    content: Optional[str] = Field(default=None, sa_column=Column(Text))
    order_index: int = Field(default=0)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)
    updated_at: datetime = Field(nullable=False, default_factory=now_cst)

    def content_as_dict(self) -> Any:
        if not self.content:
            return None
        try:
            return json.loads(self.content)
        except Exception:
            return self.content


# ── Service ───────────────────────────────────────────────────────────────
class ResumeSectionService:

    def list_by_resume(self, resume_id: int) -> List[ResumeSection]:
        with Session(engine) as session:
            return list(session.exec(
                select(ResumeSection)
                .where(ResumeSection.resume_id == resume_id)
                .order_by(ResumeSection.order_index)
            ).all())

    def get_by_resume_and_type(self, resume_id: int, section_type: str) -> Optional[ResumeSection]:
        with Session(engine) as session:
            return session.exec(
                select(ResumeSection)
                .where(
                    ResumeSection.resume_id == resume_id,
                    ResumeSection.section_type == section_type,
                )
            ).first()

    def save(self, resume_id: int, section_type: str, content: Any, order_index: int = 0) -> ResumeSection:
        """新增或覆盖某个 section"""
        content_str = json.dumps(content, ensure_ascii=False) if not isinstance(content, str) else content
        with Session(engine) as session:
            existing = session.exec(
                select(ResumeSection)
                .where(
                    ResumeSection.resume_id == resume_id,
                    ResumeSection.section_type == section_type,
                )
            ).first()
            if existing:
                existing.content = content_str
                existing.order_index = order_index
                existing.updated_at = now_cst()
                session.add(existing)
                session.commit()
                session.refresh(existing)
                return existing
            else:
                section = ResumeSection(
                    resume_id=resume_id,
                    section_type=section_type,
                    content=content_str,
                    order_index=order_index,
                )
                session.add(section)
                session.commit()
                session.refresh(section)
                return section

    def delete(self, resume_id: int, section_type: str) -> None:
        with Session(engine) as session:
            section = session.exec(
                select(ResumeSection)
                .where(
                    ResumeSection.resume_id == resume_id,
                    ResumeSection.section_type == section_type,
                )
            ).first()
            if section:
                session.delete(section)
                session.commit()

    def batch_save(self, resume_id: int, sections: Dict[str, Any]) -> List[ResumeSection]:
        """批量保存多个 section，用于 AI 生成后一次性写入"""
        result = []
        for idx, (section_type, content) in enumerate(sections.items()):
            result.append(self.save(resume_id, section_type, content, order_index=idx))
        return result


resume_section_service = ResumeSectionService()
