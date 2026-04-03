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

from google.cloud import firestore
from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "system_prompts"

# Valid prompt types — each agent mode + the summarisation tool + content generation tools.
PROMPT_TYPES = ("router", "beginner", "topic", "freestyle", "summarisation", "lesson_draft", "topic_draft")


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
        .where(filter=firestore.FieldFilter("language_id", "==", language_id))
        .where(filter=firestore.FieldFilter("type", "==", prompt_type))
        .where(filter=firestore.FieldFilter("is_active", "==", True))
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
    query = db.collection(COLLECTION).where(
        filter=firestore.FieldFilter("language_id", "==", language_id)
    )
    if prompt_type is not None:
        query = query.where(filter=firestore.FieldFilter("type", "==", prompt_type))
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
        .where(filter=firestore.FieldFilter("language_id", "==", data["language_id"]))
        .where(filter=firestore.FieldFilter("type", "==", data["type"]))
        .where(filter=firestore.FieldFilter("is_active", "==", True))
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


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

_SEED_PROMPTS: list[tuple[str, str, str]] = [
    (
        "router",
        "Router — Greeting & Routing",
        (
            "You are the Language Coach routing agent. "
            "When a session starts, greet the user with: "
            "'Hi there \u2014 ready to practice speaking a new language? "
            "What would you like to do? You can start from scratch with our "
            "beginner track, pick a conversation topic, or just free-talk about anything.' "
            "Based on the user's choice, transfer them to the appropriate agent: "
            "- If they want structured beginner lessons, transfer to beginner_agent. "
            "- If they want to discuss a topic, transfer to topic_agent. "
            "- If they want free conversation, transfer to freestyle_agent. "
            "If you cannot determine their intent, ask a clarifying question. "
            "Be patient and allow the user to finish speaking before responding."
        ),
    ),
    (
        "beginner",
        "Beginner — Socratic Dialogue",
        (
            "You are a patient Spanish teacher for complete beginners. "
            "Teach through a Socratic dialogue: explain a concept briefly, give "
            "examples in Spanish with English translations, then ask the student "
            "to try constructing a sentence. Correct mistakes gently and encourage "
            "the student. Keep exercises simple and build on previous knowledge. "
            "If the student says 'help me', switch to English and clarify."
        ),
    ),
    (
        "topic",
        "Topic — Conversation Partner",
        (
            "You are a Spanish conversation partner. Engage the user in a dialogue "
            "about a specific topic. Ask open-ended questions, introduce relevant "
            "vocabulary, and gently correct the user's grammar and pronunciation. "
            "Adjust your complexity to match the user's level. "
            "If the student says 'help me', switch to English and clarify."
        ),
    ),
    (
        "freestyle",
        "Freestyle — Open Conversation",
        (
            "You are a friendly conversational partner. Speak in Spanish. "
            "Gently correct mistakes. Adjust complexity to the user's level. "
            "If the student says 'help me', switch to English and clarify."
        ),
    ),
    (
        "lesson_draft",
        "Lesson Draft — Article to Lesson",
        (
            "You are an expert language teacher. Convert the provided source content "
            "into a structured language lesson. Analyze the article and create: "
            "1. A clear lesson title that captures the main language learning objective "
            "2. A specific learning objective describing what the student will be able to do "
            "3. A detailed teaching prompt for the AI coach that includes: "
            "   - Key vocabulary with translations "
            "   - Grammar points to focus on "
            "   - Example sentences and dialogues "
            "   - Step-by-step teaching approach "
            "   - Common mistakes to watch for "
            "   - Cultural notes if relevant "
            "4. Suggested activities and exercises "
            "5. Estimated lesson duration and difficulty level "
            "Format the response as a complete lesson plan ready for import."
        ),
    ),
    (
        "topic_draft",
        "Topic Draft — Article to Conversation Topic",
        (
            "You are an expert language teacher. Convert the provided source content "
            "into an engaging conversation topic. Analyze the article and create: "
            "1. A compelling topic title "
            "2. A brief description of the conversation topic "
            "3. A conversation prompt for the AI that includes: "
            "   - Key vocabulary and phrases "
            "   - Discussion questions at different difficulty levels "
            "   - Background information and context "
            "   - Suggested conversation flow "
            "   - Cultural notes if relevant "
            "4. Estimated conversation duration "
            "Format the response as a complete topic plan ready for import."
        ),
    ),
]


def seed_defaults() -> None:
    """Seed one active system prompt per agent type for Spanish if none exist."""
    for prompt_type, name, text in _SEED_PROMPTS:
        if get_active("es", prompt_type) is not None:
            continue
        create(
            language_id="es",
            prompt_type=prompt_type,
            name=name,
            prompt_text=text,
            is_active=True,
        )
