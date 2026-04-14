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

"""Health check endpoint (``/api/health``)."""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

_DEFAULT_TIMEOUT = float(os.environ.get("HEALTH_CHECK_TIMEOUT", "5.0"))


def _check_firestore(timeout: float) -> dict[str, Any]:
    """Verify Firestore connectivity."""
    try:
        from app.db.client import get_firestore_client

        db = get_firestore_client()
        start = time.monotonic()
        list(db.collections(page_size=1))
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        if latency_ms > timeout * 1000:
            return {"status": "degraded", "latency_ms": latency_ms, "detail": "slow"}
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as exc:
        logger.warning("Firestore health check failed: %s", exc)
        return {"status": "error", "detail": str(exc)}


def _check_redis() -> dict[str, Any]:
    """Verify Redis connectivity (skipped when REDIS_HOST is unset)."""
    host = os.environ.get("REDIS_HOST")
    if not host:
        return {"status": "skipped", "detail": "REDIS_HOST not configured"}
    try:
        from app.services.cache import _get_redis

        r = _get_redis()
        if r is None:
            return {"status": "error", "detail": "Redis client unavailable"}
        start = time.monotonic()
        r.ping()
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as exc:
        logger.warning("Redis health check failed: %s", exc)
        return {"status": "error", "detail": str(exc)}


@router.get("/api/health")
def health_check(
    timeout: float = Query(default=_DEFAULT_TIMEOUT, ge=0.1, le=30.0),
) -> JSONResponse:
    """Return application health status including dependency checks.

    Query params:
        timeout: max acceptable latency in seconds (default from
                 ``HEALTH_CHECK_TIMEOUT`` env, fallback 5 s).
    """
    checks: dict[str, Any] = {
        "firestore": _check_firestore(timeout),
        "redis": _check_redis(),
    }

    # ── Aggregate status ────────────────────────────────────────────────
    statuses = {dep.get("status") for dep in checks.values()}
    if statuses <= {"ok", "skipped"}:
        overall, status_code = "ok", 200
    elif "error" in statuses:
        overall, status_code = "degraded", 503
    else:
        overall, status_code = "degraded", 200

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
        },
        headers={"Cache-Control": "no-cache, no-store"},
    )
