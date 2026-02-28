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

"""User-facing progress endpoints (``/api/progress/``)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.db import conversations as conv_repo
from app.db import progress as progress_repo

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/")
def get_progress(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return aggregate progress stats for the current user."""
    uid = user["uid"]
    course_progress = progress_repo.list_by_user(uid)
    conversations = conv_repo.list_by_user(uid, limit=200)

    lessons_completed = sum(p.get("lessons_completed", 0) for p in course_progress)
    total_time = sum(p.get("total_time_seconds", 0) for p in course_progress)
    total_conversations = len(conversations)

    # Count sessions per mode
    mode_counts: dict[str, int] = {}
    for c in conversations:
        mode = c.get("mode", "unknown")
        mode_counts[mode] = mode_counts.get(mode, 0) + 1

    return {
        "lessons_completed": lessons_completed,
        "total_time_seconds": total_time,
        "total_conversations": total_conversations,
        "sessions_by_mode": mode_counts,
        "course_progress": course_progress,
    }


class UpdateProgressRequest(BaseModel):
    course_id: str
    current_lesson_index: int
    lessons_completed: int = 0
    total_time_seconds: int = 0


@router.put("/")
def update_progress(
    body: UpdateProgressRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Update progress for a specific course."""
    return progress_repo.upsert(
        uid=user["uid"],
        course_id=body.course_id,
        current_lesson_index=body.current_lesson_index,
        lessons_completed=body.lessons_completed,
        total_time_seconds=body.total_time_seconds,
    )
