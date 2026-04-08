from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Session

from app.db.database import engine
from app.lib.datetime_utils import now_cst


class AiLog(SQLModel, table=True):
    __tablename__ = "ai_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, max_length=32)
    resume_id: Optional[int] = Field(default=None, index=True)
    # generate / jd_optimize
    action: str = Field(max_length=50)
    input_tokens: int = Field(default=0)
    output_tokens: int = Field(default=0)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)


class AiLogService:

    def record(
        self,
        user_id: str,
        action: str,
        resume_id: Optional[int] = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
    ) -> None:
        with Session(engine) as session:
            log = AiLog(
                user_id=user_id,
                resume_id=resume_id,
                action=action,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
            session.add(log)
            session.commit()


ai_log_service = AiLogService()
