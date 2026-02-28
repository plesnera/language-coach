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

"""FastAPI dependencies for authentication.

When ``LOCAL_DEV=true`` a lightweight local token scheme is used so the
application can run without Firebase / GCP credentials.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import users as users_repo

logger = logging.getLogger(__name__)

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")

# Initialise the Firebase Admin SDK only when running against real Firebase.
if not _LOCAL_DEV:
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    if not firebase_admin._apps:
        firebase_admin.initialize_app()
else:
    logger.info("LOCAL_DEV mode — Firebase Auth disabled, using local tokens")

_bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Default dev user (auto-created on first request with the bypass token)
# ---------------------------------------------------------------------------
_DEV_UID = "local-dev-user"
_DEV_EMAIL = "dev@localhost"
_DEV_DISPLAY_NAME = "Dev User"


def _ensure_dev_user() -> dict[str, Any]:
    """Return (or create) the default dev user for local development."""
    user = users_repo.get(_DEV_UID)
    if user is not None:
        return user
    return users_repo.create(
        uid=_DEV_UID,
        email=_DEV_EMAIL,
        display_name=_DEV_DISPLAY_NAME,
        role="admin",
    )


# ---------------------------------------------------------------------------
# Main dependency
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Verify the auth token and return the user document.

    In *LOCAL_DEV* mode the following tokens are accepted:
    - ``local-{uid}`` — looks up the user by uid
    - ``dev-bypass``   — auto-creates / returns a default admin dev user

    In production mode a Firebase ID token is verified.
    """
    if credentials is None:
        if _LOCAL_DEV:
            # No token at all → auto-provision dev user for convenience
            return _ensure_dev_user()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    token = credentials.credentials

    if _LOCAL_DEV:
        return _resolve_local_token(token)

    # --- Firebase path ---
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        ) from exc

    uid: str = decoded["uid"]
    return _require_user(uid)


def _resolve_local_token(token: str) -> dict[str, Any]:
    """Parse a local-dev token and return the matching user."""
    if token == "dev-bypass":
        return _ensure_dev_user()
    if token.startswith("local-"):
        uid = token  # the full token *is* the uid
        return _require_user(uid)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid local token (expected 'local-<uid>' or 'dev-bypass')",
    )


def _require_user(uid: str) -> dict[str, Any]:
    user = users_repo.get(uid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User record not found",
        )
    if user.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    return user


async def require_admin(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Gate access to admin-only endpoints."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
