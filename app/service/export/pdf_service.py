import os
from pathlib import Path
from typing import Dict, Any, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.utils.logger_utils import get_standard_logger

logger = get_standard_logger(__name__)

_TEMPLATES_DIR = Path(__file__).parent.parent.parent.parent / "templates" / "resume"

_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def render_html(sections: Dict[str, Any], template_name: str = "default.html") -> str:
    """将 sections dict 渲染为 HTML 字符串"""
    try:
        tpl = _jinja_env.get_template(template_name)
        return tpl.render(sections=sections)
    except Exception as e:
        logger.error(f"HTML 渲染失败: {e}")
        raise


def render_pdf(sections: Dict[str, Any], template_name: str = "default.html") -> bytes:
    """将 sections dict 渲染为 PDF bytes"""
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError("weasyprint 未安装，请执行: pip install weasyprint")

    html_str = render_html(sections, template_name)
    try:
        pdf_bytes = HTML(string=html_str, base_url=str(_TEMPLATES_DIR)).write_pdf()
        if not pdf_bytes:
            raise RuntimeError("WeasyPrint 返回空 PDF")
        return pdf_bytes
    except Exception as e:
        logger.error(f"WeasyPrint PDF 生成失败: {e}")
        raise
