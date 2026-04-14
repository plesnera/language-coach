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

"""Fetch secrets from Google Secret Manager at runtime.

In local development (``LOCAL_DEV=1``) secrets fall back to plain
environment variables so that no GCP credentials are required.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")

# ── Secret Manager client (lazy) ───────────────────────────────────────────

_sm_client: Any = None


def _get_client() -> Any:
    """Return a cached Secret Manager client."""
    global _sm_client
    if _sm_client is None:
        from google.cloud import secretmanager  # type: ignore[import-untyped]

        _sm_client = secretmanager.SecretManagerServiceClient()
    return _sm_client


# ── Public API ──────────────────────────────────────────────────────────────


@lru_cache(maxsize=64)
def get_secret(
    secret_id: str,
    *,
    project_id: str | None = None,
    version: str = "latest",
) -> str | None:
    """Retrieve a secret value.

    In local-dev mode, falls back to ``os.environ[secret_id]``.

    Args:
        secret_id: The short secret name (e.g. ``"DATABASE_URL"``).
        project_id: GCP project.  Defaults to ``GOOGLE_CLOUD_PROJECT``.
        version: Secret version (default ``"latest"``).

    Returns:
        The secret payload as a string, or ``None`` if unavailable.
    """
    if _LOCAL_DEV:
        value = os.environ.get(secret_id)
        if value is None:
            logger.debug("Secret %s not found in environment (LOCAL_DEV)", secret_id)
        return value

    project = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT_ID") or os.environ.get(
        "GOOGLE_CLOUD_PROJECT"
    )
    if not project:
        logger.warning("Cannot resolve GCP project for Secret Manager")
        return None

    name = f"projects/{project}/secrets/{secret_id}/versions/{version}"
    try:
        client = _get_client()
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as exc:
        logger.warning("Failed to access secret %s: %s", secret_id, exc)
        return None


def clear_cache() -> None:
    """Clear the in-process secret cache (useful after rotation)."""
    get_secret.cache_clear()
