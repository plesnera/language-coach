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

"""Repository for the ``uploaded_documents`` collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore
from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "uploaded_documents"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(document_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(document_id).get())


def list_by_user(user_id: str) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .where(filter=firestore.FieldFilter("user_id", "==", user_id))
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create(
    user_id: str,
    filename: str,
    gcs_path: str,
    extracted_text: str,
    content_type: str,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "user_id": user_id,
        "filename": filename,
        "gcs_path": gcs_path,
        "extracted_text": extracted_text,
        "content_type": content_type,
        "created_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def delete(document_id: str) -> bool:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(document_id)
    if not ref.get().exists:
        return False
    ref.delete()
    return True
