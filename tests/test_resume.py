import os
os.environ.setdefault("DATABASE_URL", "mysql+pymysql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-minimum!!")

import json
from unittest.mock import patch, MagicMock

from app.db.resume.resume_service import ResumeService
from app.db.resume_section.resume_section_service import ResumeSectionService


# ── ResumeService ─────────────────────────────────────────────────────────

def test_resume_create():
    service = ResumeService()
    with patch("app.db.resume.resume_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        service.create(user_id=1, title="我的简历", target_role="后端工程师")
        mock_ctx.add.assert_called_once()
        mock_ctx.commit.assert_called_once()


def test_resume_get_by_id_not_found():
    service = ResumeService()
    with patch("app.db.resume.resume_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.exec.return_value.first.return_value = None
        result = service.get_by_id(99999)
        assert result is None


def test_resume_update():
    service = ResumeService()
    mock_resume = MagicMock()
    with patch("app.db.resume.resume_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.exec.return_value.first.return_value = mock_resume
        result = service.update(resume_id=1, title="新标题")
        mock_ctx.add.assert_called_once()
        mock_ctx.commit.assert_called_once()


def test_resume_update_not_found():
    service = ResumeService()
    with patch("app.db.resume.resume_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.exec.return_value.first.return_value = None
        result = service.update(resume_id=99999, title="不存在")
        assert result is None


def test_resume_delete():
    service = ResumeService()
    with patch("app.db.resume.resume_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_item = MagicMock()
        mock_ctx.exec.return_value.first.return_value = mock_item
        service.delete(1)
        mock_ctx.delete.assert_called_once_with(mock_item)
        mock_ctx.commit.assert_called_once()


# ── ResumeSectionService ──────────────────────────────────────────────────

def test_section_save_new():
    service = ResumeSectionService()
    with patch("app.db.resume_section.resume_section_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        # 模拟不存在（upsert insert 分支）
        mock_ctx.exec.return_value.first.return_value = None
        content = {"text": "5年后端经验"}
        service.save(resume_id=1, section_type="summary", content=content)
        mock_ctx.add.assert_called_once()
        mock_ctx.commit.assert_called_once()


def test_section_save_update_existing():
    service = ResumeSectionService()
    mock_existing = MagicMock()
    with patch("app.db.resume_section.resume_section_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.exec.return_value.first.return_value = mock_existing
        service.save(resume_id=1, section_type="summary", content={"text": "updated"})
        # 应更新现有记录
        assert mock_existing.content is not None
        mock_ctx.add.assert_called_once_with(mock_existing)
        mock_ctx.commit.assert_called_once()


def test_section_content_as_dict():
    from app.db.resume_section.resume_section_service import ResumeSection
    section = ResumeSection(
        resume_id=1,
        section_type="skills",
        content='{"languages": ["Python", "Go"]}',
    )
    result = section.content_as_dict()
    assert result == {"languages": ["Python", "Go"]}


def test_section_content_as_dict_none():
    from app.db.resume_section.resume_section_service import ResumeSection
    section = ResumeSection(resume_id=1, section_type="summary", content=None)
    assert section.content_as_dict() is None
