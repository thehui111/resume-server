import os
from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlmodel import create_engine, SQLModel, Session

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# ── 与 studio-server 对齐的通用基类 ─────────────────────────────────────────
class BaseResp(BaseModel):
    class Config:
        from_attributes = True


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    total: int
    items: List[T]
    page: int
    page_size: int

    @classmethod
    def from_query(cls, items: List[T], total: int, page: int, page_size: int):
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    class Config:
        from_attributes = True
