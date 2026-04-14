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

"""Rate limiting for authentication endpoints.

Uses ``slowapi`` backed by an in-memory store by default.  When
``REDIS_HOST`` is set the limiter shares state across replicas via Redis.
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# ── Limiter singleton ───────────────────────────────────────────────────────

_AUTH_DEFAULT_LIMIT = os.environ.get("AUTH_RATE_LIMIT", "10/minute")


def _build_storage_uri() -> str | None:
    """Return a Redis URI when available, else ``None`` (in-memory fallback)."""
    host = os.environ.get("REDIS_HOST")
    if not host:
        return None
    port = os.environ.get("REDIS_PORT", "6379")
    return f"redis://{host}:{port}"


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=_build_storage_uri(),
)


def configure_rate_limiting(app: FastAPI) -> None:
    """Register the ``slowapi`` limiter on the FastAPI application."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("Rate limiting configured (auth default: %s)", _AUTH_DEFAULT_LIMIT)


# Convenience decorator for auth routes
auth_rate_limit = limiter.limit(_AUTH_DEFAULT_LIMIT)
