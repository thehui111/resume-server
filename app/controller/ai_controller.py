import json
from typing import Optional, List, Any, Dict

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.db.ai_log.ai_log_service import ai_log_service
from app.db.resume.resume_service import resume_service
from app.db.resume_section.resume_section_service import resume_section_service, SECTION_TYPES
from app.db.user.user_service import User
from app.model.api_response import ApiResponse
from app.service.ai.generate_service import stream_generate
from app.service.ai.gemini_runner import run_gemini_text
from app.service.ai.jd_optimize_service import stream_jd_optimize
from app.service.ai.polish_service import polish_text
from app.utils.error_codes import ErrorCode
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

# section 默认生成顺序
DEFAULT_GENERATE_SECTIONS = ["basic_info", "summary", "work_exp", "education", "skills", "projects"]


# ── 请求模型 ──────────────────────────────────────────────────────────────
class GenerateReq(BaseModel):
    resume_id: int = Field(..., gt=0, description="要写入的简历 ID")
    target_role: str = Field(..., min_length=1, max_length=200, description="目标职位")
    raw_info: Dict[str, Any] = Field(..., description="用户原始信息，key 为描述类别，value 为自由文本")
    sections: Optional[List[str]] = Field(
        default=None,
        description="要生成的 section 列表，不传则生成全部",
    )


class JdOptimizeReq(BaseModel):
    resume_id: int = Field(..., gt=0)
    jd_text: str = Field(..., min_length=10, description="职位描述全文")
    section_types: Optional[List[str]] = Field(
        default=None,
        description="要优化的 section 类型，不传则优化简历中所有 section",
    )


class PolishTextReq(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="需要润色的文本")
    section_type: str = Field(default="", description="所属 section 类型（可选，用于提供上下文）")
    field: str = Field(default="", description="所属字段名（可选）")


class GeminiTestReq(BaseModel):
    prompt: str = Field(..., min_length=1, description="测试提示词")
    model: str = Field(default="gemini-2.5-pro", description="模型名称，如 gemini-2.5-pro / gemini-3.1-flash-preview")


# ── 接口 ──────────────────────────────────────────────────────────────────
@router.post("/generate", summary="从零 AI 生成简历（SSE 流式）")
async def ai_generate(req: GenerateReq, current_user: User = Depends(get_current_user)):
    resume = resume_service.get_by_id(req.resume_id)
    if not resume:
        return ApiResponse.fail(ErrorCode.RESUME_NOT_FOUND.code, ErrorCode.RESUME_NOT_FOUND.message)
    if resume.user_id != current_user.user_id:
        return ApiResponse.fail(ErrorCode.RESUME_ACCESS_DENIED.code, ErrorCode.RESUME_ACCESS_DENIED.message)

    sections = req.sections or DEFAULT_GENERATE_SECTIONS
    # 过滤非法 section_type
    sections = [s for s in sections if s in SECTION_TYPES]
    if not sections:
        return ApiResponse.fail(4020, "sections 中没有合法的 section_type")

    async def event_stream():
        total_input = 0
        total_output = 0
        saved_sections: Dict[str, Any] = {}

        async for chunk in stream_generate(req.target_role, req.raw_info, sections):
            yield chunk
            # 解析已完成的 section，写入数据库
            if chunk.startswith("data: "):
                try:
                    payload = json.loads(chunk[6:])
                    if "section" in payload and "content" in payload:
                        resume_section_service.save(
                            resume_id=req.resume_id,
                            section_type=payload["section"],
                            content=payload["content"],
                        )
                        saved_sections[payload["section"]] = payload["content"]
                    if payload.get("done"):
                        usage = payload.get("usage", {})
                        total_input = usage.get("input_tokens", 0)
                        total_output = usage.get("output_tokens", 0)
                except Exception:
                    pass

        # 记录 AI 使用量
        try:
            ai_log_service.record(
                user_id=current_user.user_id,
                resume_id=req.resume_id,
                action="generate",
                input_tokens=total_input,
                output_tokens=total_output,
            )
        except Exception as e:
            logger.warning(f"AI log 记录失败: {e}")

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/jd-optimize", summary="针对 JD 优化简历（SSE 流式）")
async def ai_jd_optimize(req: JdOptimizeReq, current_user: User = Depends(get_current_user)):
    resume = resume_service.get_by_id(req.resume_id)
    if not resume:
        return ApiResponse.fail(ErrorCode.RESUME_NOT_FOUND.code, ErrorCode.RESUME_NOT_FOUND.message)
    if resume.user_id != current_user.user_id:
        return ApiResponse.fail(ErrorCode.RESUME_ACCESS_DENIED.code, ErrorCode.RESUME_ACCESS_DENIED.message)

    all_sections = resume_section_service.list_by_resume(req.resume_id)
    if not all_sections:
        return ApiResponse.fail(4030, "简历内容为空，请先生成或填写简历内容")

    # 筛选要优化的 section
    if req.section_types:
        target_types = set(req.section_types) & SECTION_TYPES
        sections_to_optimize = [s for s in all_sections if s.section_type in target_types]
    else:
        sections_to_optimize = all_sections

    if not sections_to_optimize:
        return ApiResponse.fail(4031, "没有可优化的 section")

    current_sections = {s.section_type: s.content_as_dict() for s in sections_to_optimize}

    async def event_stream():
        total_input = 0
        total_output = 0

        async for chunk in stream_jd_optimize(req.jd_text, current_sections):
            yield chunk
            if chunk.startswith("data: "):
                try:
                    payload = json.loads(chunk[6:])
                    if "section" in payload and "content" in payload:
                        resume_section_service.save(
                            resume_id=req.resume_id,
                            section_type=payload["section"],
                            content=payload["content"],
                        )
                    if payload.get("done"):
                        usage = payload.get("usage", {})
                        total_input = usage.get("input_tokens", 0)
                        total_output = usage.get("output_tokens", 0)
                except Exception:
                    pass

        try:
            ai_log_service.record(
                user_id=current_user.user_id,
                resume_id=req.resume_id,
                action="jd_optimize",
                input_tokens=total_input,
                output_tokens=total_output,
            )
        except Exception as e:
            logger.warning(f"AI log 记录失败: {e}")

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/polish-text", response_model=ApiResponse, summary="AI 文本润色")
async def ai_polish_text(req: PolishTextReq, current_user: User = Depends(get_current_user)):
    """
    对选中的简历文本进行 AI 润色，返回 3 个版本供用户选择。
    """
    try:
        variants = await polish_text(req.text, req.section_type, req.field)
    except Exception as e:
        logger.error(f"AI 文本润色失败: {e}")
        return ApiResponse.fail(ErrorCode.AI_POLISH_FAILED.code, f"{ErrorCode.AI_POLISH_FAILED.message}: {str(e)}")

    return ApiResponse.ok(data={"variants": variants, "original": req.text})


@router.post("/gemini-test", response_model=ApiResponse, summary="Gemini 连通性测试")
async def ai_gemini_test(req: GeminiTestReq, current_user: User = Depends(get_current_user)):
    """
    简单测试 Gemini 模型调用是否通畅，支持 gemini-2.5-pro / gemini-3.1-flash 等模型。
    """
    try:
        text, usage = await run_gemini_text(
            system_prompt="你是一个有帮助的助手。",
            user_prompt=req.prompt,
            model=req.model,
        )
        return ApiResponse.ok(data={"text": text, "usage": usage, "model": req.model})
    except Exception as e:
        logger.error(f"Gemini 测试失败: {e}")
        return ApiResponse.fail(ErrorCode.AI_POLISH_FAILED.code, f"Gemini 测试失败: {str(e)}")
