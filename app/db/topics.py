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

"""Repository for the ``topics`` collection."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore
from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "topics"
_DEFAULT_LANGUAGE_ID = os.environ.get("DEFAULT_LANGUAGE_ID", "es")


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get(topic_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(topic_id).get())


def list_by_language(language_id: str) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .where(filter=firestore.FieldFilter("language_id", "==", language_id))
        .order_by("sort_order")
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create(
    language_id: str,
    title: str,
    description: str,
    conversation_prompt: str,
    image_url: str | None = None,
    sort_order: int = 0,
    is_default: bool = False,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "language_id": language_id,
        "title": title,
        "description": description,
        "conversation_prompt": conversation_prompt,
        "image_url": image_url,
        "sort_order": sort_order,
        "is_default": is_default,
        "created_at": now,
        "updated_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def update(topic_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(topic_id)
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def delete(topic_id: str) -> bool:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(topic_id)
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def seed_defaults() -> None:
    """Create the three default topics if none exist yet."""
    if list_by_language(_DEFAULT_LANGUAGE_ID):
        return

    from app.db.images import get_or_upload_seed_image

    defaults = [
        {
            "title": "What I did on my last vacation",
            "description": "Talk about travel, places visited, and activities.",
            "conversation_prompt": (
                "You are a Spanish conversation partner. Guide the conversation "
                "around the user's last vacation. Ask about where they went, what "
                "they did, what they saw, and how they felt. Introduce and reinforce "
                "past-tense vocabulary (pretérito indefinido / pretérito imperfecto). "
                "Gently correct mistakes and provide the Spanish translation when "
                "the user struggles."
            ),
            "image_url": get_or_upload_seed_image(
                "375bb32ff0164c3d9923b0b5328ad995.jpg"
            ),
            "sort_order": 1,
        },
        {
            "title": "About my family",
            "description": "Describe family members, relationships, and daily life.",
            "conversation_prompt": (
                "You are a Spanish conversation partner. Guide the conversation "
                "around the user's family. Ask about family members, their names, "
                "ages, occupations, and personalities. Help the user practice "
                "possessive adjectives, descriptive adjectives, and verbs for "
                "identity and state. Gently correct mistakes."
            ),
            "image_url": get_or_upload_seed_image(
                "2ecdf8f52bf84707bc11242a6a5bf02f.jpg"
            ),
            "sort_order": 2,
        },
        {
            "title": "My job and other jobs",
            "description": "Discuss professions, daily routines, and workplace vocabulary.",
            "conversation_prompt": (
                "You are a Spanish conversation partner. Guide the conversation "
                "around the user's job and professions in general. Ask what they "
                "do, their daily routine, what they like and dislike about work, "
                "and what other jobs interest them. Reinforce vocabulary for "
                "professions, daily routine verbs, and time expressions. "
                "Gently correct mistakes."
            ),
            "image_url": get_or_upload_seed_image(
                "75ddbd3b5d8c410180ffcf146c7360dc.jpg"
            ),
            "sort_order": 3,
        },
    ]
    for topic in defaults:
        create(
            language_id=_DEFAULT_LANGUAGE_ID,
            title=topic["title"],
            description=topic["description"],
            conversation_prompt=topic["conversation_prompt"],
            image_url=topic.get("image_url", ""),
            sort_order=topic["sort_order"],
            is_default=True,
        )
