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

"""User-facing course endpoints (``/api/courses/``)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.db import courses as courses_repo
from app.services import cache

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("/")
def list_courses(
    language_id: str = Query(...),
    _user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    cache_key = f"courses:lang:{language_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = courses_repo.list_by_language(language_id)
    cache.set(cache_key, result, ttl=120)
    return result


@router.get("/{course_id}/lessons")
def list_lessons(
    course_id: str,
    _user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    if courses_repo.get(course_id) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_repo.list_lessons(course_id)


@router.get("/{course_id}/lessons/{lesson_id}")
def get_lesson(
    course_id: str,
    lesson_id: str,
    _user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    lesson = courses_repo.get_lesson(course_id, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
