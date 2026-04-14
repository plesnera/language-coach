"""Extended authentication tests.

Covers password-reset flows, registration edge cases, token edge cases,
concurrent sessions, and role-based access control.
"""

from __future__ import annotations

import os
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

pytestmark = [
    pytest.mark.requires_emulator,
    pytest.mark.skipif(
        not os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"),
        reason="FIREBASE_AUTH_EMULATOR_HOST not set — start the Auth emulator first",
    ),
]


@pytest.fixture()
def client():
    from app.app_utils.expose_app import app

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── Password reset flow ─────────────────────────────────────────────────────


class TestForgotPassword:
    """Forgot-password endpoint must never leak email existence."""

    def test_valid_email_returns_success(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/forgot-password",
            json={"email": "existing@example.com"},
        )
        assert resp.status_code == 200
        assert "reset link has been sent" in resp.json()["detail"]

    def test_unknown_email_returns_same_response(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent-user-xyz@nowhere.dev"},
        )
        assert resp.status_code == 200
        assert "reset link has been sent" in resp.json()["detail"]

    def test_malformed_email_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/forgot-password",
            json={"email": "not-an-email"},
        )
        assert resp.status_code == 422

    def test_empty_body_returns_422(self, client: TestClient) -> None:
        resp = client.post("/api/auth/forgot-password", json={})
        assert resp.status_code == 422


# ── Registration edge cases ─────────────────────────────────────────────────


class TestRegistration:
    def test_successful_registration(self, client: TestClient) -> None:
        import uuid

        email = f"reg-test-{uuid.uuid4().hex[:8]}@test.local"
        resp = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "securepassword123",
                "display_name": "Test User",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == email
        assert data["display_name"] == "Test User"
        assert data["role"] == "user"
        assert "uid" in data

    def test_duplicate_email_returns_409(self, client: TestClient) -> None:
        import uuid

        email = f"dup-test-{uuid.uuid4().hex[:8]}@test.local"
        payload = {
            "email": email,
            "password": "securepassword123",
            "display_name": "First",
        }
        resp1 = client.post("/api/auth/register", json=payload)
        assert resp1.status_code == 201

        resp2 = client.post("/api/auth/register", json=payload)
        assert resp2.status_code == 409
        assert "already registered" in resp2.json()["detail"]

    def test_missing_email_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/register",
            json={"password": "test123456", "display_name": "No Email"},
        )
        assert resp.status_code == 422

    def test_missing_password_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/register",
            json={"email": "x@test.local", "display_name": "No Pass"},
        )
        assert resp.status_code == 422

    def test_missing_display_name_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/register",
            json={"email": "x@test.local", "password": "test123456"},
        )
        assert resp.status_code == 422

    def test_invalid_email_format_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "test123456",
                "display_name": "Bad Email",
            },
        )
        assert resp.status_code == 422


# ── Token edge cases ────────────────────────────────────────────────────────


class TestTokenEdgeCases:
    def test_empty_bearer_token_returns_401(self, client: TestClient) -> None:
        resp = client.get(
            "/api/admin/languages",
            headers={"Authorization": "Bearer "},
        )
        assert resp.status_code == 401

    def test_malformed_auth_header_returns_401_or_403(
        self, client: TestClient
    ) -> None:
        # No "Bearer" prefix
        resp = client.get(
            "/api/admin/languages",
            headers={"Authorization": "Token some-value"},
        )
        assert resp.status_code in (401, 403)

    def test_garbage_token_returns_401(self, client: TestClient) -> None:
        resp = client.get(
            "/api/admin/languages",
            headers=_auth_headers("x" * 200),
        )
        assert resp.status_code == 401
        assert "Invalid authentication token" in resp.json()["detail"]


# ── Concurrent sessions ────────────────────────────────────────────────────


class TestConcurrentSessions:
    def test_multiple_tokens_for_same_user_both_valid(
        self,
        client: TestClient,
        auth_token_factory: Callable[..., tuple[str, str]],
    ) -> None:
        """A user can hold multiple valid tokens simultaneously."""
        token1, uid = auth_token_factory(role="admin")
        # Create a second token by signing in again via the emulator REST API
        import requests

        auth_host = os.environ["FIREBASE_AUTH_EMULATOR_HOST"]
        # Get user email from Firestore
        from app.db import users as users_repo

        user = users_repo.get(uid)
        assert user is not None

        # Sign in again to get a second token
        sign_in = requests.post(
            f"http://{auth_host}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            "?key=fake-api-key",
            json={
                "email": user["email"],
                "password": "testpassword123",
                "returnSecureToken": True,
            },
            timeout=10,
        )
        if sign_in.status_code == 200:
            token2 = sign_in.json()["idToken"]
            # Both tokens should work
            resp1 = client.get(
                "/api/admin/languages", headers=_auth_headers(token1)
            )
            resp2 = client.get(
                "/api/admin/languages", headers=_auth_headers(token2)
            )
            assert resp1.status_code == 200
            assert resp2.status_code == 200


# ── Role-based access control ──────────────────────────────────────────────


class TestRoleBasedAccess:
    def test_regular_user_cannot_access_admin(
        self,
        client: TestClient,
        auth_token_factory: Callable[..., tuple[str, str]],
    ) -> None:
        token, _ = auth_token_factory(role="user")
        resp = client.get("/api/admin/languages", headers=_auth_headers(token))
        assert resp.status_code == 403
        assert resp.json()["detail"] == "Admin access required"

    def test_admin_can_access_admin(
        self,
        client: TestClient,
        auth_token_factory: Callable[..., tuple[str, str]],
    ) -> None:
        token, _ = auth_token_factory(role="admin")
        resp = client.get("/api/admin/languages", headers=_auth_headers(token))
        assert resp.status_code == 200

    def test_register_creates_user_role(self, client: TestClient) -> None:
        import uuid

        email = f"role-test-{uuid.uuid4().hex[:8]}@test.local"
        resp = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "securepassword123",
                "display_name": "Role Test",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["role"] == "user"
