"""Unit tests for rate limiting on auth endpoints."""

from __future__ import annotations

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def _make_rate_limited_app(limit: str = "3/minute") -> FastAPI:
    """Build a small app with a rate-limited endpoint for testing."""
    app = FastAPI()
    limiter = Limiter(key_func=get_remote_address, default_limits=[])
    app.state.limiter = limiter

    from slowapi import _rate_limit_exceeded_handler

    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.post("/api/auth/register")
    @limiter.limit(limit)
    def register(request: Request):
        return JSONResponse({"status": "ok"})

    @app.post("/api/auth/forgot-password")
    @limiter.limit(limit)
    def forgot_password(request: Request):
        return JSONResponse({"status": "ok"})

    return app


@pytest.fixture()
def client() -> TestClient:
    return TestClient(_make_rate_limited_app(limit="3/minute"))


class TestRateLimiting:
    def test_requests_within_limit_succeed(self, client: TestClient) -> None:
        for _ in range(3):
            resp = client.post("/api/auth/register")
            assert resp.status_code == 200

    def test_exceeding_limit_returns_429(self, client: TestClient) -> None:
        for _ in range(3):
            client.post("/api/auth/register")
        resp = client.post("/api/auth/register")
        assert resp.status_code == 429

    def test_forgot_password_rate_limited(self, client: TestClient) -> None:
        for _ in range(3):
            client.post("/api/auth/forgot-password")
        resp = client.post("/api/auth/forgot-password")
        assert resp.status_code == 429

    def test_different_endpoints_have_separate_limits(
        self, client: TestClient
    ) -> None:
        """Register and forgot-password each have their own limit bucket."""
        for _ in range(3):
            client.post("/api/auth/register")
        # forgot-password should still be within its own limit
        resp = client.post("/api/auth/forgot-password")
        assert resp.status_code == 200
