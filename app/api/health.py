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
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check() -> JSONResponse:
    """Return application health status including dependency checks."""
    checks: dict[str, Any] = {}

    # ── Firestore connectivity ──────────────────────────────────────────
    try:
        from app.db.client import get_firestore_client

        db = get_firestore_client()
        start = time.monotonic()
        # Lightweight read — list first collection (limit 1)
        list(db.collections(page_size=1))
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        checks["firestore"] = {"status": "ok", "latency_ms": latency_ms}
    except Exception as exc:
        logger.warning("Firestore health check failed: %s", exc)
        checks["firestore"] = {"status": "error", "detail": str(exc)}

    # ── Aggregate status ────────────────────────────────────────────────
    all_ok = all(
        dep.get("status") == "ok" for dep in checks.values()
    )
    status_code = 200 if all_ok else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if all_ok else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
        },
        headers={"Cache-Control": "no-cache, no-store"},
    )
