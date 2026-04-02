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

In production Firebase Admin SDK verifies ID tokens directly.
In local-dev mode, ``FIREBASE_AUTH_EMULATOR_HOST`` causes the SDK to talk
to the Auth Emulator instead — no special bypass logic is needed.
"""

from __future__ import annotations

import logging
from typing import Any

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from app.db import users as users_repo

logger = logging.getLogger(__name__)


def _ensure_firebase_app() -> None:
    """Lazily initialise the Firebase Admin SDK.

    When ``FIREBASE_AUTH_EMULATOR_HOST`` is set the SDK routes to the
    emulator automatically.
    """
    if not firebase_admin._apps:
        firebase_admin.initialize_app()


_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Main dependency
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Verify a Firebase ID token and return the Firestore user document."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    token = credentials.credentials

    _ensure_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        ) from exc

    uid: str = decoded["uid"]
    return _require_user(uid)


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
