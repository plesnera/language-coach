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

"""Repository for the ``conversations`` collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "conversations"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(conversation_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(conversation_id).get())


def list_by_user(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .where("user_id", "==", user_id)
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create(
    user_id: str,
    language_id: str,
    mode: str,
    topic_id: str | None = None,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "user_id": user_id,
        "language_id": language_id,
        "mode": mode,
        "topic_id": topic_id,
        "messages": [],
        "created_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def append_message(conversation_id: str, role: str, text: str) -> None:
    """Append a message to an existing conversation."""
    from google.cloud.firestore_v1 import ArrayUnion

    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(conversation_id)
    ref.update(
        {
            "messages": ArrayUnion(
                [{"role": role, "text": text, "timestamp": datetime.now(timezone.utc)}]
            )
        }
    )
