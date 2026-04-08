from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.auth.jwt_utils import hash_password, verify_password, create_access_token
from app.db.user.user_service import user_service
from app.model.api_response import ApiResponse
from app.utils.error_codes import ErrorCode
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    name: str = Field(min_length=1, max_length=100)


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class AuthResp(BaseModel):
    token: str
    user_id: str
    email: str
    name: str


@router.post("/register", response_model=ApiResponse, summary="注册")
async def register(req: RegisterReq):
    if user_service.get_by_email(req.email):
        return ApiResponse.fail(ErrorCode.EMAIL_ALREADY_EXISTS.code, ErrorCode.EMAIL_ALREADY_EXISTS.message)
    user = user_service.create(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
    )
    token = create_access_token(user.user_id, user.email)
    return ApiResponse.ok(data=AuthResp(token=token, user_id=user.user_id, email=user.email, name=user.name))


@router.post("/login", response_model=ApiResponse, summary="登录")
async def login(req: LoginReq):
    user = user_service.get_by_email(req.email)
    if not user or not verify_password(req.password, user.password_hash):
        return ApiResponse.fail(ErrorCode.INVALID_CREDENTIALS.code, ErrorCode.INVALID_CREDENTIALS.message)
    token = create_access_token(user.user_id, user.email)
    return ApiResponse.ok(data=AuthResp(token=token, user_id=user.user_id, email=user.email, name=user.name))
