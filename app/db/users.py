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

"""Repository for the ``users`` collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "users"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["uid"] = doc.id
    return data


def get(uid: str) -> dict[str, Any] | None:
    """Return a user by UID."""
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(uid).get())


def create(
    uid: str,
    email: str,
    display_name: str,
    role: str = "user",
) -> dict[str, Any]:
    """Create a new user document."""
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "email": email,
        "display_name": display_name,
        "role": role,
        "disabled": False,
        "created_at": now,
        "updated_at": now,
    }
    db.collection(COLLECTION).document(uid).set(data)
    return {"uid": uid, **data}


def update(uid: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    """Update selected fields on a user document."""
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(uid)
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def list_all(limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
    """Return a paginated list of users."""
    db = get_firestore_client()
    query = db.collection(COLLECTION).order_by("created_at").offset(offset).limit(limit)
    return [d for doc in query.stream() if (d := _doc_to_dict(doc)) is not None]
