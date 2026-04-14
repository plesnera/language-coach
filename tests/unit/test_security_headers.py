"""Unit tests for the security headers middleware and CORS configuration."""

from __future__ import annotations

import os
from typing import ClassVar
from unittest import mock

import pytest
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from fastapi.testclient import TestClient

from app.app_utils.security import SecurityHeadersMiddleware, configure_security


def _make_app(**configure_kwargs) -> FastAPI:
    """Create a minimal FastAPI app with security middleware applied."""
    app = FastAPI()

    @app.get("/test")
    def _endpoint():
        return PlainTextResponse("ok")

    configure_security(app)
    return app


@pytest.fixture()
def client() -> TestClient:
    return TestClient(_make_app())


# ── Security header presence ────────────────────────────────────────────────


class TestSecurityHeaders:
    EXPECTED_HEADERS: ClassVar[dict[str, str]] = {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
    }

    def test_all_security_headers_present(self, client: TestClient) -> None:
        resp = client.get("/test")
        assert resp.status_code == 200
        for header, expected in self.EXPECTED_HEADERS.items():
            assert resp.headers.get(header) == expected, (
                f"Expected {header}={expected!r}, got {resp.headers.get(header)!r}"
            )

    def test_permissions_policy_present(self, client: TestClient) -> None:
        resp = client.get("/test")
        pp = resp.headers.get("permissions-policy", "")
        assert "camera=()" in pp
        assert "geolocation=()" in pp

    def test_csp_header_present(self, client: TestClient) -> None:
        resp = client.get("/test")
        csp = resp.headers.get("content-security-policy", "")
        assert "default-src 'self'" in csp
        assert "script-src" in csp

    def test_hsts_not_set_for_http(self, client: TestClient) -> None:
        """HSTS should only be added when scheme is https."""
        resp = client.get("/test")
        assert "strict-transport-security" not in resp.headers

    def test_hsts_set_for_https(self) -> None:
        """When base_url is https, HSTS header must be present."""
        app = _make_app()
        with TestClient(app, base_url="https://testserver") as https_client:
            resp = https_client.get("/test")
            hsts = resp.headers.get("strict-transport-security", "")
            assert "max-age=" in hsts
            assert "includeSubDomains" in hsts


# ── CORS configuration ─────────────────────────────────────────────────────


class TestCORSConfiguration:
    def test_default_wildcard_cors(self) -> None:
        """Without ALLOWED_ORIGINS env var, CORS allows all origins."""
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("ALLOWED_ORIGINS", None)
            app = _make_app()

        with TestClient(app) as c:
            resp = c.options(
                "/test",
                headers={
                    "Origin": "https://example.com",
                    "Access-Control-Request-Method": "GET",
                },
            )
            assert resp.headers.get("access-control-allow-origin") in (
                "*",
                "https://example.com",
            )

    def test_custom_allowed_origins(self) -> None:
        """ALLOWED_ORIGINS restricts the allowed origins."""
        with mock.patch.dict(
            os.environ, {"ALLOWED_ORIGINS": "https://myapp.example.com"}
        ):
            app = _make_app()

        with TestClient(app) as c:
            # Allowed origin
            resp = c.options(
                "/test",
                headers={
                    "Origin": "https://myapp.example.com",
                    "Access-Control-Request-Method": "GET",
                },
            )
            assert (
                resp.headers.get("access-control-allow-origin")
                == "https://myapp.example.com"
            )

    def test_multiple_allowed_origins(self) -> None:
        """Comma-separated origins are all accepted."""
        with mock.patch.dict(
            os.environ,
            {"ALLOWED_ORIGINS": "https://a.com, https://b.com"},
        ):
            app = _make_app()

        with TestClient(app) as c:
            resp = c.options(
                "/test",
                headers={
                    "Origin": "https://a.com",
                    "Access-Control-Request-Method": "GET",
                },
            )
            assert resp.headers.get("access-control-allow-origin") == "https://a.com"


# ── Header non-overwrite (setdefault) behaviour ────────────────────────────


class TestHeaderSetdefault:
    def test_existing_header_not_overwritten(self) -> None:
        """If the endpoint already sets a header, middleware must not overwrite."""
        app = FastAPI()

        @app.get("/custom-csp")
        def _custom():
            return PlainTextResponse(
                "ok",
                headers={"X-Frame-Options": "SAMEORIGIN"},
            )

        app.add_middleware(SecurityHeadersMiddleware)

        with TestClient(app) as c:
            resp = c.get("/custom-csp")
            assert resp.headers["x-frame-options"] == "SAMEORIGIN"
