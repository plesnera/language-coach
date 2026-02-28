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

"""Repository for the ``system_prompts`` collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "system_prompts"

# Valid prompt types — each agent mode + the summarisation tool.
PROMPT_TYPES = ("beginner", "topic", "freestyle", "summarisation")


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(prompt_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(prompt_id).get())


def get_active(language_id: str, prompt_type: str) -> dict[str, Any] | None:
    """Return the currently active prompt for a language + type pair."""
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .where("language_id", "==", language_id)
        .where("type", "==", prompt_type)
        .where("is_active", "==", True)
        .limit(1)
        .stream()
    )
    for doc in docs:
        return _doc_to_dict(doc)
    return None


def list_by_language(
    language_id: str, prompt_type: str | None = None
) -> list[dict[str, Any]]:
    db = get_firestore_client()
    query = db.collection(COLLECTION).where("language_id", "==", language_id)
    if prompt_type is not None:
        query = query.where("type", "==", prompt_type)
    return [d for doc in query.stream() if (d := _doc_to_dict(doc)) is not None]


def create(
    language_id: str,
    prompt_type: str,
    name: str,
    prompt_text: str,
    is_active: bool = False,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "language_id": language_id,
        "type": prompt_type,
        "name": name,
        "prompt_text": prompt_text,
        "is_active": is_active,
        "created_at": now,
        "updated_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def update(prompt_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(prompt_id)
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def activate(prompt_id: str) -> dict[str, Any] | None:
    """Activate a prompt and deactivate all siblings (same language + type)."""
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(prompt_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    # Deactivate siblings
    siblings = (
        db.collection(COLLECTION)
        .where("language_id", "==", data["language_id"])
        .where("type", "==", data["type"])
        .where("is_active", "==", True)
        .stream()
    )
    for sibling in siblings:
        sibling.reference.update(
            {"is_active": False, "updated_at": datetime.now(timezone.utc)}
        )
    # Activate the target
    ref.update({"is_active": True, "updated_at": datetime.now(timezone.utc)})
    return _doc_to_dict(ref.get())


def delete(prompt_id: str) -> bool:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(prompt_id)
    if not ref.get().exists:
        return False
    ref.delete()
    return True
