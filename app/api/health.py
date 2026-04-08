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

"""Health check endpoint (``/api/health``).

Returns application health status including dependency checks for
Firestore and external services. Designed for use with load balancers,
uptime checks, and monitoring systems.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

# Timeout for individual dependency checks (seconds)
_CHECK_TIMEOUT_SECONDS = 5.0


def _check_firestore() -> dict[str, Any]:
    """Verify Firestore connectivity by listing a single collection."""
    start = time.monotonic()
    try:
        from app.db.client import get_firestore_client

        db = get_firestore_client()
        # Lightweight read: list 1 document from any collection
        list(db.collections(page_size=1))
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as exc:
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        logger.warning("Firestore health check failed: %s", exc)
        return {"status": "error", "latency_ms": latency_ms, "error": str(exc)}


@router.get("/api/health")
def health_check(response: Response) -> dict[str, Any]:
    """Return application health status.

    Returns 200 if all critical dependencies are healthy, 503 otherwise.
    Includes ``Cache-Control: no-cache`` to prevent stale health data.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

    firestore = _check_firestore()

    checks = {"firestore": firestore}
    overall = "ok" if all(c["status"] == "ok" for c in checks.values()) else "degraded"

    if overall != "ok":
        response.status_code = 503

    return {
        "status": overall,
        "checks": checks,
    }
