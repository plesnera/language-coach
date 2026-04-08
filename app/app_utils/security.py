# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Security headers middleware and CORS configuration.

Adds OWASP-recommended security headers to every HTTP response and
provides environment-aware CORS settings (permissive in local-dev,
strict in production).
"""

from __future__ import annotations

import os

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")

# ---------------------------------------------------------------------------
# Allowed origins — override with ALLOWED_ORIGINS env var (comma-separated)
# ---------------------------------------------------------------------------
_DEFAULT_PROD_ORIGINS: list[str] = []  # Populate with your production domains
_ALLOWED_ORIGINS_ENV = os.environ.get("ALLOWED_ORIGINS", "")

if _LOCAL_DEV:
    ALLOWED_ORIGINS: list[str] = ["*"]
elif _ALLOWED_ORIGINS_ENV:
    ALLOWED_ORIGINS = [o.strip() for o in _ALLOWED_ORIGINS_ENV.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = _DEFAULT_PROD_ORIGINS


# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject OWASP-recommended security headers into every response."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser features
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(self), geolocation=(), payment=()"
        )

        # Note: microphone=(self) is required because this app uses
        # audio-based language lessons via WebRTC/MediaRecorder.

        # HSTS — only in production (not behind local dev)
        if not _LOCAL_DEV:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # CSP — permissive enough for the SPA + WebSocket + audio worklets
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://storage.googleapis.com",
            "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com",
            "media-src 'self' blob:",
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        return response


# ---------------------------------------------------------------------------
# Helper to wire everything into a FastAPI app
# ---------------------------------------------------------------------------


def configure_security(app: FastAPI) -> None:
    """Add security headers middleware and CORS to the FastAPI app.

    Call this instead of manually adding CORSMiddleware.
    """
    # Security headers (runs after CORS middleware in the response chain)
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,  # Preflight cache: 10 minutes
    )
