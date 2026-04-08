import os
os.environ.setdefault("DATABASE_URL", "mysql+pymysql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-minimum!!")

from app.service.export.pdf_service import render_html

SAMPLE_SECTIONS = {
    "basic_info": {
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "location": "北京",
        "linkedin": "",
        "github": "github.com/zhangsan",
    },
    "summary": {"text": "5年后端开发经验，擅长高并发系统设计。"},
    "work_exp": [
        {
            "company": "字节跳动",
            "title": "高级工程师",
            "start": "2022-03",
            "end": "2024-06",
            "description": "- 主导推荐系统重构\n- 延迟降低 40%",
        }
    ],
    "education": [
        {
            "school": "北京大学",
            "degree": "本科",
            "major": "计算机科学",
            "start": "2018-09",
            "end": "2022-06",
        }
    ],
    "skills": {
        "languages": ["Python", "Go"],
        "frameworks": ["FastAPI", "gRPC"],
        "tools": ["Docker", "Kubernetes"],
    },
    "projects": [
        {
            "name": "实时推荐引擎",
            "role": "负责人",
            "description": "日处理 1 亿条请求的推荐系统",
            "tech_stack": ["Python", "Kafka", "Redis"],
        }
    ],
}


def test_render_html_contains_name():
    html = render_html(SAMPLE_SECTIONS)
    assert "张三" in html


def test_render_html_contains_company():
    html = render_html(SAMPLE_SECTIONS)
    assert "字节跳动" in html


def test_render_html_contains_school():
    html = render_html(SAMPLE_SECTIONS)
    assert "北京大学" in html


def test_render_html_empty_sections():
    html = render_html({})
    assert "<body>" in html


def test_render_html_missing_optional_sections():
    """只有 basic_info，其他 section 缺失不应报错"""
    html = render_html({"basic_info": SAMPLE_SECTIONS["basic_info"]})
    assert "张三" in html
