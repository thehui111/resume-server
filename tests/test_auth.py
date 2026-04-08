import os
os.environ.setdefault("DATABASE_URL", "mysql+pymysql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-minimum!!")

from unittest.mock import patch, MagicMock
from app.auth.jwt_utils import hash_password, verify_password, create_access_token, decode_token
from app.db.user.user_service import UserService, User


def test_password_hash_and_verify():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_encode_decode():
    token = create_access_token(42, "user@example.com")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["email"] == "user@example.com"


def test_jwt_invalid_token():
    result = decode_token("not.a.valid.token")
    assert result is None


def test_user_service_create():
    service = UserService()
    with patch("app.db.user.user_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.refresh = MagicMock()
        service.create("a@b.com", "hash", "Alice")
        mock_ctx.add.assert_called_once()
        mock_ctx.commit.assert_called_once()


def test_user_service_get_by_email_not_found():
    service = UserService()
    with patch("app.db.user.user_service.Session") as mock_session:
        mock_ctx = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_ctx
        mock_ctx.exec.return_value.first.return_value = None
        result = service.get_by_email("nobody@example.com")
        assert result is None
