import os

os.environ.setdefault("DATABASE_URL", "mysql+pymysql://test:test@localhost/test")

import asyncio
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.service.ai.avatar_service import avatar_service


@pytest.mark.asyncio
async def test_optimize_avatar_success():
    """测试头像优化成功"""
    with patch("app.service.ai.avatar_service.avatar_service._call_edit_api", new_callable=AsyncMock) as mock_edit:
        mock_edit.return_value = {"image_url": "https://example.com/optimized.jpg"}
        result = await avatar_service.optimize_avatar("https://example.com/original.jpg")
        assert result == "https://example.com/optimized.jpg"
        mock_edit.assert_awaited_once()


@pytest.mark.asyncio
async def test_change_background_success():
    """测试修改头像背景色成功"""
    with patch("app.service.ai.avatar_service.avatar_service._call_edit_api", new_callable=AsyncMock) as mock_edit:
        mock_edit.return_value = {"image_url": "https://example.com/bg_changed.jpg"}
        result = await avatar_service.change_background("https://example.com/original.jpg", "white")
        assert result == "https://example.com/bg_changed.jpg"
        mock_edit.assert_awaited_once()


@pytest.mark.asyncio
async def test_call_edit_api_success_sync_mode():
    """测试直接返回 outputs 的同步模式"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "outputs": ["https://example.com/result.jpg"],
        }
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await avatar_service._call_edit_api("test prompt", ["https://example.com/img.jpg"])
        assert result["image_url"] == "https://example.com/result.jpg"


@pytest.mark.asyncio
async def test_call_edit_api_poll_mode():
    """测试需要轮询的异步模式"""
    mock_post_response = MagicMock()
    mock_post_response.status_code = 200
    mock_post_response.json.return_value = {
        "data": {
            "id": "req_123",
            "outputs": [],
        }
    }

    mock_get_response = MagicMock()
    mock_get_response.status_code = 200
    mock_get_response.json.return_value = {
        "data": {
            "status": "completed",
            "outputs": ["https://example.com/polled.jpg"],
        }
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_post_response):
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_get_response):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                result = await avatar_service._call_edit_api("test prompt", ["https://example.com/img.jpg"])
                assert result["image_url"] == "https://example.com/polled.jpg"


@pytest.mark.asyncio
async def test_call_edit_api_retries_and_raises():
    """测试 API 重试后仍失败会抛出异常"""
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(Exception) as exc_info:
                await avatar_service._call_edit_api("test prompt", ["https://example.com/img.jpg"])
            assert "WaveSpeed edit API failed" in str(exc_info.value)
