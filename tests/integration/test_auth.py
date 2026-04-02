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
