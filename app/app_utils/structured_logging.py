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

"""Structured logging middleware with trace-ID correlation.

Every inbound request is assigned a unique trace ID (or reuses the
``X-Cloud-Trace-Context`` header if present).  The ID is injected into
Python's ``logging`` context so that **all** log records emitted during
that request carry a ``trace_id`` attribute and can be correlated in
Cloud Logging.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)

# ── Context variable shared across the request lifecycle ────────────────────

_trace_id_var: ContextVar[str] = ContextVar("trace_id", default="")


def get_trace_id() -> str:
    """Return the current request's trace ID (empty string outside a request)."""
    return _trace_id_var.get()


# ── Logging filter that injects trace_id into every LogRecord ───────────────


class TraceIdFilter(logging.Filter):
    """Adds ``trace_id`` to every log record automatically."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.trace_id = _trace_id_var.get()  # type: ignore[attr-defined]
        return True


# ── Middleware ──────────────────────────────────────────────────────────────


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Assign a trace ID to each request and emit structured access logs."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Prefer Cloud Trace header; fall back to a new UUID-based ID
        cloud_trace = request.headers.get("X-Cloud-Trace-Context", "")
        trace_id = cloud_trace.split("/")[0] if cloud_trace else uuid.uuid4().hex

        token = _trace_id_var.set(trace_id)
        start = time.monotonic()

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "Unhandled exception",
                extra={"trace_id": trace_id, "path": request.url.path},
            )
            raise
        finally:
            duration_ms = round((time.monotonic() - start) * 1000, 1)
            logger.info(
                "%s %s %s %.1fms",
                request.method,
                request.url.path,
                getattr(response, "status_code", "ERR"),  # type: ignore[possibly-undefined]
                duration_ms,
                extra={
                    "trace_id": trace_id,
                    "http_method": request.method,
                    "http_path": request.url.path,
                    "http_status": getattr(response, "status_code", None),  # type: ignore[possibly-undefined]
                    "duration_ms": duration_ms,
                },
            )
            # Propagate the trace ID on the response for client debugging
            if hasattr(response, "headers"):  # type: ignore[possibly-undefined]
                response.headers["X-Trace-Id"] = trace_id  # type: ignore[possibly-undefined]

            _trace_id_var.reset(token)

        return response  # type: ignore[possibly-undefined]


# ── Setup helper ────────────────────────────────────────────────────────────

_LOG_FORMAT = "%(asctime)s %(levelname)s [%(trace_id)s] %(name)s: %(message)s"


def configure_structured_logging(app: FastAPI) -> None:
    """Install the trace-ID middleware and structured log format."""
    # Add the filter to the root logger so every module benefits
    root = logging.getLogger()
    root.addFilter(TraceIdFilter())

    # Only replace the formatter when NOT running under Cloud Logging
    # (Cloud Logging agent already formats JSON).
    if os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes"):
        for handler in root.handlers or [logging.StreamHandler()]:
            handler.setFormatter(logging.Formatter(_LOG_FORMAT))

    app.add_middleware(StructuredLoggingMiddleware)
