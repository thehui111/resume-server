import os

os.environ.setdefault("DATABASE_URL", "mysql+pymysql://test:test@localhost/test")

import asyncio
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.service.ai.image_service import image_service, VIDEO_BASE_URL


@pytest.mark.asyncio
async def test_banana_generate_image_success():
    """测试 banana 生图成功"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"data": {"image_url": "https://example.com/banana.jpg"}}'
    mock_response.json.return_value = {"data": {"image_url": "https://example.com/banana.jpg"}}
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await image_service.banana_generate_image("a cute cat")
        assert result["image_url"] == "https://example.com/banana.jpg"


@pytest.mark.asyncio
async def test_banana_generate_image_retries_and_raises():
    """测试 banana 生图重试后仍失败"""
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Server Error"
    mock_response.raise_for_status.side_effect = Exception("HTTP 500")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(Exception) as exc_info:
                await image_service.banana_generate_image("a cute cat")
            assert "banana_generate_image failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_seedream_generate_image_success():
    """测试 seedream 生图成功"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"images": [{"url": "https://example.com/seedream.jpg"}]}'
    mock_response.json.return_value = {"images": [{"url": "https://example.com/seedream.jpg"}]}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await image_service.seedream_generate_image("a beautiful landscape")
        assert result["images"][0]["url"] == "https://example.com/seedream.jpg"


@pytest.mark.asyncio
async def test_seedream_generate_image_api_error():
    """测试 seedream 返回业务错误码"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"code": 4001, "message": "bad prompt"}'
    mock_response.json.return_value = {"code": 4001, "message": "bad prompt"}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(Exception) as exc_info:
                await image_service.seedream_generate_image("bad prompt")
            assert "seedream_generate_images API error" in str(exc_info.value)


@pytest.mark.asyncio
async def test_seedream_generate_image_http_error():
    """测试 seedream HTTP 错误"""
    mock_response = MagicMock()
    mock_response.status_code = 502
    mock_response.text = "Bad Gateway"
    mock_response.json.return_value = {}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(Exception) as exc_info:
                await image_service.seedream_generate_image("a cat")
            assert "HTTP error" in str(exc_info.value)


@pytest.mark.asyncio
async def test_edit_image_success():
    """测试通用图片编辑成功"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"image_url": "https://example.com/edited.jpg"}'
    mock_response.json.return_value = {"image_url": "https://example.com/edited.jpg"}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await image_service.edit_image("change background to white", ["https://example.com/original.jpg"])
        assert result["image_url"] == "https://example.com/edited.jpg"


@pytest.mark.asyncio
async def test_edit_image_data_wrapper():
    """测试通用图片编辑返回 data 包装格式"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"data": {"image_url": "https://example.com/edited2.jpg"}}'
    mock_response.json.return_value = {"data": {"image_url": "https://example.com/edited2.jpg"}}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await image_service.edit_image("make it brighter", ["https://example.com/original.jpg"])
        assert result["image_url"] == "https://example.com/edited2.jpg"


@pytest.mark.asyncio
async def test_edit_image_retries_and_raises():
    """测试通用图片编辑重试后仍失败"""
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(Exception) as exc_info:
                await image_service.edit_image("edit", ["https://example.com/original.jpg"])
            assert "edit_image failed after 3 retries" in str(exc_info.value)
