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

"""Repository for the ``languages`` collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "languages"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(language_id: str) -> dict[str, Any] | None:
    """Return a single language by ID."""
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(language_id).get())


def list_enabled() -> list[dict[str, Any]]:
    """Return all enabled languages."""
    db = get_firestore_client()
    docs = db.collection(COLLECTION).where("enabled", "==", True).stream()
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def list_all() -> list[dict[str, Any]]:
    """Return all languages."""
    db = get_firestore_client()
    return [
        d
        for doc in db.collection(COLLECTION).stream()
        if (d := _doc_to_dict(doc)) is not None
    ]


def create(language_id: str, name: str, enabled: bool = True) -> dict[str, Any]:
    """Create a new language document."""
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "name": name,
        "enabled": enabled,
        "created_at": now,
        "updated_at": now,
    }
    db.collection(COLLECTION).document(language_id).set(data)
    return {"id": language_id, **data}


def update(language_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    """Update selected fields on a language document."""
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(language_id)
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def seed_defaults() -> None:
    """Ensure the default Spanish language exists."""
    if get("es") is None:
        create("es", "Spanish", enabled=True)
