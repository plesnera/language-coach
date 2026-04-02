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

"""Repository for user progress tracking.

Progress is stored as sub-documents under ``users/{uid}/progress/{course_id}``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

USERS_COL = "users"
PROGRESS_SUB = "progress"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(uid: str, course_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = (
        db.collection(USERS_COL)
        .document(uid)
        .collection(PROGRESS_SUB)
        .document(course_id)
    )
    return _doc_to_dict(ref.get())


def list_by_user(uid: str) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = db.collection(USERS_COL).document(uid).collection(PROGRESS_SUB).stream()
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def upsert(
    uid: str,
    course_id: str,
    current_lesson_index: int,
    lessons_completed: int = 0,
    total_time_seconds: int = 0,
) -> dict[str, Any]:
    db = get_firestore_client()
    ref = (
        db.collection(USERS_COL)
        .document(uid)
        .collection(PROGRESS_SUB)
        .document(course_id)
    )
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "current_lesson_index": current_lesson_index,
        "lessons_completed": lessons_completed,
        "total_time_seconds": total_time_seconds,
        "updated_at": now,
    }
    existing = ref.get()
    if existing.exists:
        ref.update(data)
    else:
        data["created_at"] = now
        ref.set(data)
    return {"id": course_id, **data}
