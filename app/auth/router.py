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

"""REST endpoints for authentication (``/api/auth/``).

When ``LOCAL_DEV=true`` the endpoints skip Firebase and create users
directly in the (in-memory) datastore, returning local tokens.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.db import users as users_repo

logger = logging.getLogger(__name__)

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")

if not _LOCAL_DEV:
    from firebase_admin import auth as firebase_auth

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Request / Response schemas ──────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class RegisterResponse(BaseModel):
    uid: str
    email: str
    display_name: str
    role: str
    token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest) -> dict[str, Any]:
    """Create a user.

    In production this goes through Firebase Auth.
    In LOCAL_DEV mode the user is created directly in the in-memory store.
    """
    if _LOCAL_DEV:
        return _register_local(body)
    return _register_firebase(body)


@router.post("/forgot-password", status_code=200)
def forgot_password(body: ForgotPasswordRequest) -> dict[str, str]:
    """Send a password-reset email (no-op in local mode)."""
    if not _LOCAL_DEV:
        try:
            firebase_auth.generate_password_reset_link(body.email)
        except Exception:
            pass  # Don't leak whether the email exists.
    return {"detail": "If that email is registered, a reset link has been sent."}


# ── Internal helpers ────────────────────────────────────────────────────────


def _register_local(body: RegisterRequest) -> dict[str, Any]:
    uid = f"local-{uuid.uuid4().hex[:12]}"
    user_doc = users_repo.create(
        uid=uid,
        email=body.email,
        display_name=body.display_name,
        role="user",
    )
    user_doc["token"] = uid  # the uid doubles as the local bearer token
    return user_doc


def _register_firebase(body: RegisterRequest) -> dict[str, Any]:
    try:
        fb_user = firebase_auth.create_user(
            email=body.email,
            password=body.password,
            display_name=body.display_name,
        )
    except firebase_auth.EmailAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc
    except Exception as exc:
        logger.exception("Firebase user creation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create user: {exc}",
        ) from exc

    user_doc = users_repo.create(
        uid=fb_user.uid,
        email=body.email,
        display_name=body.display_name,
        role="user",
    )
    firebase_auth.set_custom_user_claims(fb_user.uid, {"role": "user"})
    return user_doc
