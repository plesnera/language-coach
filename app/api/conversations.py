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

"""User-facing conversation history endpoints (``/api/conversations/``)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.db import conversations as conv_repo

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("/")
def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return the current user's conversations, most recent first."""
    return conv_repo.list_by_user(user["uid"], limit=limit)


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return a single conversation with its messages."""
    doc = conv_repo.get(conversation_id)
    if doc is None or doc.get("user_id") != user["uid"]:
        raise HTTPException(404, "Conversation not found")
    return doc
