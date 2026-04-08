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

"""Thin caching layer backed by Redis.

Falls back to a no-op when ``REDIS_HOST`` is not set (local dev).
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_TTL = 300  # 5 minutes

# ── Redis client singleton ──────────────────────────────────────────────────

_redis_client: Any = None
_initialised = False


def _get_redis() -> Any | None:
    """Lazily create and return a Redis client, or ``None`` if unavailable."""
    global _redis_client, _initialised
    if _initialised:
        return _redis_client

    _initialised = True
    host = os.environ.get("REDIS_HOST")
    if not host:
        logger.info("REDIS_HOST not set — caching disabled (no-op)")
        return None

    try:
        import redis

        port = int(os.environ.get("REDIS_PORT", "6379"))
        _redis_client = redis.Redis(host=host, port=port, decode_responses=True)
        _redis_client.ping()
        logger.info("Connected to Redis at %s:%s", host, port)
    except Exception as exc:
        logger.warning("Could not connect to Redis (%s) — caching disabled", exc)
        _redis_client = None

    return _redis_client


# ── Public API ──────────────────────────────────────────────────────────────


def get(key: str) -> Any | None:
    """Retrieve a cached value.  Returns ``None`` on miss or if Redis is unavailable."""
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception:
        logger.debug("Cache get failed for key=%s", key, exc_info=True)
        return None


def set(key: str, value: Any, ttl: int = _DEFAULT_TTL) -> None:
    """Store a value in the cache with the given TTL (seconds)."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        logger.debug("Cache set failed for key=%s", key, exc_info=True)


def delete(key: str) -> None:
    """Remove a single key from the cache."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        logger.debug("Cache delete failed for key=%s", key, exc_info=True)


def invalidate_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern (e.g. ``courses:*``)."""
    r = _get_redis()
    if r is None:
        return
    try:
        cursor = 0
        while True:
            cursor, keys = r.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                r.delete(*keys)
            if cursor == 0:
                break
    except Exception:
        logger.debug("Cache invalidate_pattern failed for %s", pattern, exc_info=True)
