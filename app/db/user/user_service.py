from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter
from sqlmodel import SQLModel, Field, Session, select

from app.db.database import engine
from app.lib.datetime_utils import now_cst
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)


def _generate_user_id() -> str:
    return uuid.uuid4().hex[:16]


# ── 表模型 ────────────────────────────────────────────────────────────────
class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(max_length=32, unique=True, index=True)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    name: str = Field(max_length=100)
    created_at: datetime = Field(nullable=False, default_factory=now_cst)
    updated_at: datetime = Field(nullable=False, default_factory=now_cst)


# ── Service ───────────────────────────────────────────────────────────────
class UserService:

    def create(self, email: str, password_hash: str, name: str) -> User:
        with Session(engine) as session:
            user = User(
                user_id=_generate_user_id(),
                email=email,
                password_hash=password_hash,
                name=name,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    def get_by_email(self, email: str) -> Optional[User]:
        with Session(engine) as session:
            return session.exec(
                select(User).where(User.email == email)
            ).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        with Session(engine) as session:
            return session.exec(
                select(User).where(User.id == user_id)
            ).first()

    def get_by_user_id(self, user_id: str) -> Optional[User]:
        with Session(engine) as session:
            return session.exec(
                select(User).where(User.user_id == user_id)
            ).first()


user_service = UserService()
