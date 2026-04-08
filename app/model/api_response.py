from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    code: int
    message: str
    data: Optional[T] = None

    @classmethod
    def ok(cls, data: Any = None) -> "ApiResponse":
        return cls(success=True, code=0, message="ok", data=data)

    @classmethod
    def fail(cls, code: int, message: str) -> "ApiResponse":
        return cls(success=False, code=code, message=message, data=None)


class Page(BaseModel, Generic[T]):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def from_query(
        cls,
        items: list,
        total: int,
        page: int,
        page_size: int,
    ) -> "Page":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
