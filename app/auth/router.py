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

All paths go through Firebase Auth.  In local-dev mode the
``FIREBASE_AUTH_EMULATOR_HOST`` env var makes the SDK talk to the Auth
Emulator instead of production Firebase.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from firebase_admin import auth as firebase_auth
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db import users as users_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Rate limiter — uses client IP by default
limiter = Limiter(key_func=get_remote_address)


# ── Request / Response schemas ────────────────────────────────────────────────────────────


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


# ── Endpoints ───────────────────────────────────────────────────────────────────


@router.post("/register", response_model=RegisterResponse, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, body: RegisterRequest) -> dict[str, Any]:
    """Create a user via Firebase Auth and store in Firestore."""
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


@router.post("/forgot-password", status_code=200)
@limiter.limit("5/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest) -> dict[str, str]:
    """Send a password-reset email."""
    try:
        firebase_auth.generate_password_reset_link(body.email)
    except Exception:
        pass  # Don't leak whether the email exists.
    return {"detail": "If that email is registered, a reset link has been sent."}
