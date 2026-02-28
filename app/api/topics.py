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

"""User-facing topic endpoints (``/api/topics/``)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.db import topics as topics_repo

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("/")
def list_topics(
    language_id: str = Query(...),
    _user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    return topics_repo.list_by_language(language_id)


@router.get("/{topic_id}")
def get_topic(
    topic_id: str,
    _user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    topic = topics_repo.get(topic_id)
    if topic is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
