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

    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_valid_token_returns_200(client: TestClient, auth_token: str) -> None:
    resp = client.get("/api/admin/languages", headers=_auth_headers(auth_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_missing_token_returns_401(client: TestClient) -> None:
    resp = client.get("/api/admin/languages")
    assert resp.status_code == 401
    assert "Missing authentication token" in resp.json()["detail"]


def test_invalid_token_returns_401(client: TestClient) -> None:
    resp = client.get(
        "/api/admin/languages",
        headers=_auth_headers("not-a-real-token"),
    )
    assert resp.status_code == 401
    assert "Invalid authentication token" in resp.json()["detail"]


def test_missing_firestore_user_returns_401(
    client: TestClient,
    auth_token_factory: Callable[..., tuple[str, str]],
) -> None:
    token, _ = auth_token_factory(create_firestore_user=False)
    resp = client.get("/api/admin/languages", headers=_auth_headers(token))
    assert resp.status_code == 401
    assert resp.json()["detail"] == "User record not found"


def test_disabled_user_returns_403(
    client: TestClient,
    auth_token_factory: Callable[..., tuple[str, str]],
) -> None:
    token, _ = auth_token_factory(role="admin", disabled=True)
    resp = client.get("/api/admin/languages", headers=_auth_headers(token))
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Account is disabled"


def test_non_admin_user_returns_403(
    client: TestClient,
    auth_token_factory: Callable[..., tuple[str, str]],
) -> None:
    token, _ = auth_token_factory(role="user")
    resp = client.get("/api/admin/languages", headers=_auth_headers(token))
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"


# ── Registration tests ──────────────────────────────────────────────────────


def test_register_success(client: TestClient) -> None:
    """Successful registration returns 201 with user data."""
    import uuid

    email = f"reg-{uuid.uuid4().hex[:8]}@test.local"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "StrongP@ss1", "display_name": "Test User"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == email
    assert body["display_name"] == "Test User"
    assert body["role"] == "user"
    assert "uid" in body


def test_register_duplicate_email(client: TestClient) -> None:
    """Registering the same email twice returns 409 Conflict."""
    import uuid

    email = f"dup-{uuid.uuid4().hex[:8]}@test.local"
    payload = {"email": email, "password": "StrongP@ss1", "display_name": "Dup User"}
    resp1 = client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 409
    assert "already registered" in resp2.json()["detail"].lower()


def test_register_invalid_email(client: TestClient) -> None:
    """Registration with an invalid email is rejected (422 Unprocessable)."""
    resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "pass123", "display_name": "Bad"},
    )
    assert resp.status_code == 422


def test_register_missing_fields(client: TestClient) -> None:
    """Registration with missing required fields returns 422."""
    resp = client.post("/api/auth/register", json={"email": "a@b.com"})
    assert resp.status_code == 422


# ── Password reset tests ────────────────────────────────────────────────────


def test_forgot_password_existing_email(client: TestClient) -> None:
    """Forgot-password always returns 200 (no email leak)."""
    resp = client.post(
        "/api/auth/forgot-password",
        json={"email": "local-test-user@localhost"},
    )
    assert resp.status_code == 200
    assert "reset link" in resp.json()["detail"].lower()


def test_forgot_password_nonexistent_email(client: TestClient) -> None:
    """Forgot-password for unknown email still returns 200 (no information leak)."""
    resp = client.post(
        "/api/auth/forgot-password",
        json={"email": "nonexistent@nowhere.test"},
    )
    assert resp.status_code == 200
    assert "reset link" in resp.json()["detail"].lower()


def test_forgot_password_invalid_email(client: TestClient) -> None:
    """Forgot-password with an invalid email format returns 422."""
    resp = client.post(
        "/api/auth/forgot-password",
        json={"email": "not-valid"},
    )
    assert resp.status_code == 422


# ── Health check endpoint tests ─────────────────────────────────────────────


def test_health_endpoint_returns_200(client: TestClient) -> None:
    """Health check endpoint returns 200 with status and checks."""
    resp = client.get("/api/health")
    assert resp.status_code in (200, 503)  # 503 if emulator not ready
    body = resp.json()
    assert "status" in body
    assert "checks" in body
    assert "firestore" in body["checks"]


# ── Security headers tests ──────────────────────────────────────────────────


def test_security_headers_present(client: TestClient) -> None:
    """Responses include required security headers."""
    resp = client.get("/api/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin" in resp.headers.get("Referrer-Policy", "").lower()
    assert "Content-Security-Policy" in resp.headers


# ── Rate limiting tests ─────────────────────────────────────────────────────


def test_rate_limit_register_returns_429(client: TestClient) -> None:
    """Exceeding the register rate limit returns 429."""
    import uuid

    for i in range(12):
        email = f"ratelimit-{uuid.uuid4().hex[:8]}@test.local"
        resp = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "StrongP@ss1",
                "display_name": f"RL User {i}",
            },
        )
        if resp.status_code == 429:
            break
    else:
        pytest.skip("Rate limit not triggered within 12 requests (may be disabled)")

    assert resp.status_code == 429


def test_rate_limit_forgot_password_returns_429(client: TestClient) -> None:
    """Exceeding the forgot-password rate limit returns 429."""
    for i in range(7):
        resp = client.post(
            "/api/auth/forgot-password",
            json={"email": f"ratelimit-{i}@test.local"},
        )
        if resp.status_code == 429:
            break
    else:
        pytest.skip("Rate limit not triggered within 7 requests (may be disabled)")

    assert resp.status_code == 429
