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

"""Repository for the ``courses`` collection and ``lessons`` sub-collection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "courses"
LESSONS_SUB = "lessons"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


# ── Courses ─────────────────────────────────────────────────────────────────


def get(course_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    return _doc_to_dict(db.collection(COLLECTION).document(course_id).get())


def list_by_language(language_id: str) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .where("language_id", "==", language_id)
        .order_by("sort_order")
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create(
    language_id: str,
    title: str,
    description: str,
    sort_order: int = 0,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "language_id": language_id,
        "title": title,
        "description": description,
        "sort_order": sort_order,
        "created_at": now,
        "updated_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def update(course_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(course_id)
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def delete(course_id: str) -> bool:
    """Delete a course and all its lessons."""
    db = get_firestore_client()
    ref = db.collection(COLLECTION).document(course_id)
    if not ref.get().exists:
        return False
    # Delete sub-collection lessons first
    for lesson in ref.collection(LESSONS_SUB).stream():
        lesson.reference.delete()
    ref.delete()
    return True


# ── Lessons ─────────────────────────────────────────────────────────────────


def get_lesson(course_id: str, lesson_id: str) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = (
        db.collection(COLLECTION)
        .document(course_id)
        .collection(LESSONS_SUB)
        .document(lesson_id)
    )
    return _doc_to_dict(ref.get())


def list_lessons(course_id: str) -> list[dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .document(course_id)
        .collection(LESSONS_SUB)
        .order_by("sort_order")
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create_lesson(
    course_id: str,
    title: str,
    objective: str,
    teaching_prompt: str,
    sort_order: int = 0,
    source_audio_ref: str | None = None,
    source_transcript: str | None = None,
    image_url: str | None = None,
) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "title": title,
        "objective": objective,
        "teaching_prompt": teaching_prompt,
        "sort_order": sort_order,
        "source_audio_ref": source_audio_ref,
        "source_transcript": source_transcript,
        "image_url": image_url,
        "created_at": now,
        "updated_at": now,
    }
    ref = (
        db.collection(COLLECTION).document(course_id).collection(LESSONS_SUB).document()
    )
    ref.set(data)
    return {"id": ref.id, **data}


def update_lesson(
    course_id: str, lesson_id: str, fields: dict[str, Any]
) -> dict[str, Any] | None:
    db = get_firestore_client()
    ref = (
        db.collection(COLLECTION)
        .document(course_id)
        .collection(LESSONS_SUB)
        .document(lesson_id)
    )
    if not ref.get().exists:
        return None
    fields["updated_at"] = datetime.now(timezone.utc)
    ref.update(fields)
    return _doc_to_dict(ref.get())


def delete_lesson(course_id: str, lesson_id: str) -> bool:
    db = get_firestore_client()
    ref = (
        db.collection(COLLECTION)
        .document(course_id)
        .collection(LESSONS_SUB)
        .document(lesson_id)
    )
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def seed_defaults() -> None:
    """Create a default Spanish beginner course with starter lessons if none exist."""
    if list_by_language("es"):
        return

    from app.db.images import get_or_upload_seed_image

    course = create(
        language_id="es",
        title="Spanish for Beginners",
        description="Build a solid foundation in everyday Spanish.",
        sort_order=1,
    )
    lessons = [
        {
            "title": "Greetings & Introductions",
            "objective": "Learn how to say hello, goodbye and introduce yourself.",
            "teaching_prompt": (
                "You are a friendly Spanish tutor. Teach the student basic "
                "greetings (hola, buenos días, buenas tardes, buenas noches) "
                "and how to introduce themselves (me llamo…, soy…). Keep it "
                "simple, encouraging, and conversational."
            ),
            "image_url": get_or_upload_seed_image("caballeros.jpg"),
            "sort_order": 1,
        },
        {
            "title": "Numbers & Counting",
            "objective": "Count from 1 to 100 and use numbers in context.",
            "teaching_prompt": (
                "You are a friendly Spanish tutor. Teach the student numbers "
                "from 1–100. Practice by asking them their age, phone number, "
                "or prices. Gently correct pronunciation."
            ),
            "image_url": get_or_upload_seed_image("castagnettes.jpg"),
            "sort_order": 2,
        },
        {
            "title": "At the Restaurant",
            "objective": "Order food and drinks at a restaurant.",
            "teaching_prompt": (
                "You are a friendly Spanish tutor. Role-play ordering at a "
                "restaurant. Teach key phrases: me gustaría…, la cuenta por "
                "favor, ¿qué recomienda? Introduce food vocabulary."
            ),
            "image_url": get_or_upload_seed_image("cheese.jpg"),
            "sort_order": 3,
        },
        {
            "title": "Asking for Directions",
            "objective": "Navigate a city and understand basic directions.",
            "teaching_prompt": (
                "You are a friendly Spanish tutor. Teach directional vocabulary "
                "(izquierda, derecha, todo recto, cerca, lejos) and phrases "
                "like ¿dónde está…? Practice with a role-play scenario."
            ),
            "image_url": get_or_upload_seed_image("75ddbd3b5d8c410180ffcf146c7360dc.jpg"),
            "sort_order": 4,
        },
    ]
    for lesson in lessons:
        create_lesson(course["id"], **lesson)
