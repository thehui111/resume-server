from typing import Optional, List, Any

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import Response, JSONResponse, HTMLResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.db.resume.resume_service import resume_service, Resume
from app.db.resume_section.resume_section_service import resume_section_service, ResumeSection, SECTION_TYPES
from app.db.template.template_service import template_service
from app.db.user.user_service import User
from app.model.api_response import ApiResponse, Page
from app.service.export.pdf_service import render_html, render_pdf
from app.utils.error_codes import ErrorCode
from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])


# ── 响应模型 ──────────────────────────────────────────────────────────────
class SectionResp(BaseModel):
    section_type: str
    content: Any
    order_index: int


class ResumeResp(BaseModel):
    id: int
    title: str
    template_id: Optional[int]
    status: str
    target_role: Optional[str]
    sections: List[SectionResp] = []
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, resume: Resume, sections: List[ResumeSection] = None) -> "ResumeResp":
        return cls(
            id=resume.id,
            title=resume.title,
            template_id=resume.template_id,
            status=resume.status,
            target_role=resume.target_role,
            sections=[
                SectionResp(
                    section_type=s.section_type,
                    content=s.content_as_dict(),
                    order_index=s.order_index,
                )
                for s in (sections or [])
            ],
            created_at=resume.created_at.isoformat(),
            updated_at=resume.updated_at.isoformat(),
        )


class ResumeSummaryResp(BaseModel):
    id: int
    title: str
    template_id: Optional[int]
    status: str
    target_role: Optional[str]
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, resume: Resume) -> "ResumeSummaryResp":
        return cls(
            id=resume.id,
            title=resume.title,
            template_id=resume.template_id,
            status=resume.status,
            target_role=resume.target_role,
            created_at=resume.created_at.isoformat(),
            updated_at=resume.updated_at.isoformat(),
        )


class TemplateResp(BaseModel):
    id: int
    name: str
    file_name: str
    thumbnail_url: Optional[str]
    is_premium: bool


# ── 请求模型 ──────────────────────────────────────────────────────────────
class CreateResumeReq(BaseModel):
    title: str = Field(default="未命名简历", max_length=255)
    target_role: Optional[str] = Field(default=None, max_length=200)


class UpdateResumeReq(BaseModel):
    id: int = Field(..., gt=0)
    title: Optional[str] = Field(default=None, max_length=255)
    template_id: Optional[int] = None
    target_role: Optional[str] = Field(default=None, max_length=200)
    status: Optional[str] = Field(default=None, pattern="^(draft|published)$")


class DetailResumeReq(BaseModel):
    id: int = Field(..., gt=0)


class DeleteResumeReq(BaseModel):
    id: int = Field(..., gt=0)


class ListResumeReq(BaseModel):
    page: int = Field(default=1, gt=0)
    page_size: int = Field(default=20, gt=0, le=100)


class SaveSectionReq(BaseModel):
    resume_id: int = Field(..., gt=0)
    section_type: str
    content: Any
    order_index: int = Field(default=0, ge=0)


class DeleteSectionReq(BaseModel):
    resume_id: int = Field(..., gt=0)
    section_type: str


class ExportPdfReq(BaseModel):
    resume_id: int = Field(..., gt=0)
    template_name: str = Field(default="default.html", description="模板文件名")


# ── 工具函数 ──────────────────────────────────────────────────────────────
_TEMPLATE_FILE_MAP = {
    "默认模板": "default.html",
    "Classic 经典": "classic.html",
    "Clean 清新": "clean.html",
    "Minimal 极简": "minimal.html",
    "Professional 商务": "professional.html",
    "Modern 现代": "modern.html",
    "Creative 创意": "creative.html",
}


def _template_file_name(name: str) -> str:
    """将模板名映射为 HTML 文件名，未知名称则转小写下划线"""
    if name in _TEMPLATE_FILE_MAP:
        return _TEMPLATE_FILE_MAP[name]
    safe = name.lower().replace(" ", "_")
    return f"{safe}.html"


def _check_resume_owner(resume_id: int, user: User):
    resume = resume_service.get_by_id(resume_id)
    if not resume:
        return None, ApiResponse.fail(ErrorCode.RESUME_NOT_FOUND.code, ErrorCode.RESUME_NOT_FOUND.message)
    if resume.user_id != user.user_id:
        return None, ApiResponse.fail(ErrorCode.RESUME_ACCESS_DENIED.code, ErrorCode.RESUME_ACCESS_DENIED.message)
    return resume, None


# ── 简历 CRUD ─────────────────────────────────────────────────────────────
@router.post("/create", response_model=ApiResponse, summary="创建简历")
async def create_resume(req: CreateResumeReq, current_user: User = Depends(get_current_user)):
    resume = resume_service.create(
        user_id=current_user.user_id,
        title=req.title,
        target_role=req.target_role,
    )
    return ApiResponse.ok(data=ResumeResp.from_model(resume))


@router.post("/detail", response_model=ApiResponse, summary="查询简历详情（含所有 section）")
async def detail_resume(req: DetailResumeReq, current_user: User = Depends(get_current_user)):
    resume, err = _check_resume_owner(req.id, current_user)
    if err:
        return err
    sections = resume_section_service.list_by_resume(resume.id)
    return ApiResponse.ok(data=ResumeResp.from_model(resume, sections))


@router.post("/list", response_model=ApiResponse, summary="我的简历列表")
async def list_resume(req: ListResumeReq, current_user: User = Depends(get_current_user)):
    items, total = resume_service.list_by_user(current_user.user_id, req.page, req.page_size)
    return ApiResponse.ok(data=Page.from_query(
        items=[ResumeSummaryResp.from_model(r) for r in items],
        total=total,
        page=req.page,
        page_size=req.page_size,
    ))


@router.post("/update", response_model=ApiResponse, summary="更新简历基础信息")
async def update_resume(req: UpdateResumeReq, current_user: User = Depends(get_current_user)):
    _, err = _check_resume_owner(req.id, current_user)
    if err:
        return err
    resume = resume_service.update(
        resume_id=req.id,
        title=req.title,
        template_id=req.template_id,
        target_role=req.target_role,
        status=req.status,
    )
    return ApiResponse.ok(data=ResumeSummaryResp.from_model(resume))


@router.post("/delete", response_model=ApiResponse, summary="删除简历")
async def delete_resume(req: DeleteResumeReq, current_user: User = Depends(get_current_user)):
    _, err = _check_resume_owner(req.id, current_user)
    if err:
        return err
    resume_section_service  # sections 会随 resume 一起手动清理
    _delete_sections_by_resume(req.id)
    resume_service.delete(req.id)
    return ApiResponse.ok()


def _delete_sections_by_resume(resume_id: int) -> None:
    sections = resume_section_service.list_by_resume(resume_id)
    for s in sections:
        resume_section_service.delete(resume_id, s.section_type)


# ── Section ───────────────────────────────────────────────────────────────
@router.post("/section/save", response_model=ApiResponse, summary="新增或更新 section")
async def save_section(req: SaveSectionReq, current_user: User = Depends(get_current_user)):
    _, err = _check_resume_owner(req.resume_id, current_user)
    if err:
        return err
    if req.section_type not in SECTION_TYPES:
        return ApiResponse.fail(4020, f"section_type 无效，可选值: {', '.join(sorted(SECTION_TYPES))}")
    section = resume_section_service.save(req.resume_id, req.section_type, req.content, req.order_index)
    return ApiResponse.ok(data=SectionResp(
        section_type=section.section_type,
        content=section.content_as_dict(),
        order_index=section.order_index,
    ))


@router.post("/section/delete", response_model=ApiResponse, summary="删除 section")
async def delete_section(req: DeleteSectionReq, current_user: User = Depends(get_current_user)):
    _, err = _check_resume_owner(req.resume_id, current_user)
    if err:
        return err
    resume_section_service.delete(req.resume_id, req.section_type)
    return ApiResponse.ok()


# ── PDF 导出 ──────────────────────────────────────────────────────────────
@router.post("/export/pdf", summary="导出 PDF")
async def export_pdf(req: ExportPdfReq, current_user: User = Depends(get_current_user)):
    resume, err = _check_resume_owner(req.resume_id, current_user)
    if err:
        return err
    sections_list = resume_section_service.list_by_resume(req.resume_id)
    sections_dict = {s.section_type: s.content_as_dict() for s in sections_list}
    try:
        pdf_bytes = render_pdf(sections_dict, req.template_name)
    except Exception as e:
        logger.error(f"PDF 导出失败 resume_id={req.resume_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "code": ErrorCode.PDF_EXPORT_FAILED.code, "message": ErrorCode.PDF_EXPORT_FAILED.message},
        )

    filename = f"resume_{req.resume_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── 模板列表 ──────────────────────────────────────────────────────────────
@router.get("/templates", response_model=ApiResponse, summary="简历模板列表")
async def list_templates():
    templates = template_service.list_all()
    return ApiResponse.ok(data=[
        TemplateResp(id=t.id, name=t.name, file_name=_template_file_name(t.name), thumbnail_url=t.thumbnail_url, is_premium=t.is_premium)
        for t in templates
    ])


# ── 图片上传 ──────────────────────────────────────────────────────────────
@router.post("/upload-image", response_model=ApiResponse, summary="上传头像图片到 OSS")
async def upload_image(
    file: UploadFile = File(..., description="图片文件，支持 jpg/png/webp，不超过 5MB"),
    current_user: User = Depends(get_current_user),
):
    from app.lib.oss_uploader import upload_image as oss_upload_image

    ext = (file.filename or "").rsplit(".", 1)[-1] if "." in (file.filename or "") else ""
    data = await file.read()
    try:
        url = oss_upload_image(data, ext, current_user.user_id)
    except ValueError as e:
        return ApiResponse.fail(4040, str(e))
    except Exception as e:
        logger.error(f"图片上传失败: {e}")
        return ApiResponse.fail(4041, "图片上传失败，请稍后重试")
    return ApiResponse.ok(data={"url": url})


# ── HTML 预览 ─────────────────────────────────────────────────────────────
@router.get("/{resume_id}/preview", summary="简历 HTML 预览")
async def preview_resume(
    resume_id: int,
    template_name: str = "default.html",
    current_user: User = Depends(get_current_user),
):
    resume, err = _check_resume_owner(resume_id, current_user)
    if err:
        return err
    sections_list = resume_section_service.list_by_resume(resume_id)
    sections_dict = {s.section_type: s.content_as_dict() for s in sections_list}
    try:
        html_str = render_html(sections_dict, template_name)
    except Exception as e:
        logger.error(f"HTML 渲染失败 resume_id={resume_id}: {e}")
        return JSONResponse(status_code=500, content={"message": "渲染失败"})
    return HTMLResponse(content=html_str)
