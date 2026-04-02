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

"""Unit tests for service modules and db repos (Phase 2-4)."""

from __future__ import annotations

import os

import pytest

# Ensure LOCAL_DEV is set so services return placeholders.
# Note: tests should run against the emulator, but service stubs still
# check LOCAL_DEV to return mock values without real GCP credentials.
os.environ.setdefault("LOCAL_DEV", "true")


# ── Document Processing ─────────────────────────────────────────────────────


def test_extract_text_from_txt() -> None:
    from app.services.document_processing import extract_text

    text = extract_text(b"Hello, world!", "test.txt")
    assert text == "Hello, world!"


def test_extract_text_from_md() -> None:
    from app.services.document_processing import extract_text

    text = extract_text(b"# Title\nContent", "readme.md")
    assert "Title" in text


def test_validate_extension_rejects_exe() -> None:
    import pytest

    from app.services.document_processing import validate_extension

    with pytest.raises(ValueError, match="not allowed"):
        validate_extension("malware.exe")


def test_validate_extension_accepts_pdf() -> None:
    from app.services.document_processing import validate_extension

    # Should not raise
    validate_extension("document.pdf")


def test_validate_extension_accepts_docx() -> None:
    from app.services.document_processing import validate_extension

    validate_extension("file.docx")


def test_save_upload_local_dev() -> None:
    """In LOCAL_DEV mode, save_upload writes to local filesystem."""
    from app.services.document_processing import save_upload

    path = save_upload("test-user", "test.txt", b"content")
    assert "test-user" in path
    assert ".txt" in path


# ── Audio Transcription ─────────────────────────────────────────────────────


def test_transcribe_audio_local_dev() -> None:
    from app.services.audio_transcription import transcribe_audio

    result = transcribe_audio(b"fake-audio-data")
    assert "LOCAL_DEV" in result


# ── Summarisation ────────────────────────────────────────────────────────────


def test_summarise_local_dev() -> None:
    from app.services.summarisation import summarise

    result = summarise("some transcript", "Summarise this.")
    assert "LOCAL_DEV" in result


# ── AI Lesson Builder ───────────────────────────────────────────────────────


def test_generate_lesson_draft_local_dev() -> None:
    from app.services.lesson_builder_ai import generate_lesson_draft

    result = generate_lesson_draft(
        source_content="A short source text about travel conversations.",
        language_id="es",
        learner_level="beginner",
        lesson_length_minutes=10,
        focus_skills=["speaking", "listening"],
        constraints="Keep turns short",
    )

    assert result["title"] == "AI Draft Lesson"
    assert "guided dialogue" in result["objective"]
    assert "patient language coach" in result["teaching_prompt"]
    assert result["ai_generation_context"]["language_id"] == "es"
    assert result["ai_generation_context"]["learner_level"] == "beginner"
    assert result["ai_generation_context"]["lesson_length_minutes"] == 10
    assert result["ai_generation_context"]["focus_skills"] == ["speaking", "listening"]
    assert result["ai_generation_context"]["constraints"] == "Keep turns short"


def test_refine_lesson_draft_local_dev_normalizes_visual_aids() -> None:
    from app.services.lesson_builder_ai import refine_lesson_draft

    current_draft = {
        "title": "Lesson title",
        "objective": "Original objective",
        "teaching_prompt": "Original prompt",
        "prompt_design_notes": "Original notes",
        "visual_aids": [
            {"type": "invalid", "title": "Bad", "description": "Bad", "data": {}}
        ],
        "ai_generation_context": {
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 8,
            "focus_skills": ["speaking"],
            "constraints": None,
        },
    }

    result = refine_lesson_draft(
        current_draft=current_draft,
        admin_instruction="Add more role-play prompts",
        conversation_summary="Initial version generated.",
    )

    assert "Refined:" in result["objective"]
    assert result["visual_aids"] == []
    assert result["ai_generation_context"]["lesson_length_minutes"] == 8


# ── DB Repos (with in-memory store) ─────────────────────────────────────────


@pytest.mark.requires_emulator
def test_conversations_repo_crud() -> None:
    from app.db import conversations as conv_repo

    doc = conv_repo.create(
        user_id="u1",
        language_id="es",
        mode="freestyle",
    )
    assert doc["id"]
    assert doc["user_id"] == "u1"
    assert doc["messages"] == []

    fetched = conv_repo.get(doc["id"])
    assert fetched is not None
    assert fetched["mode"] == "freestyle"

    items = conv_repo.list_by_user("u1")
    assert len(items) >= 1


@pytest.mark.requires_emulator
def test_conversations_append_message() -> None:
    from app.db import conversations as conv_repo

    doc = conv_repo.create(user_id="u2", language_id="es", mode="topic")
    conv_repo.append_message(doc["id"], "user", "Hola")

    updated = conv_repo.get(doc["id"])
    assert updated is not None
    assert len(updated["messages"]) >= 1


@pytest.mark.requires_emulator
def test_progress_repo_upsert() -> None:
    from app.db import progress as progress_repo

    result = progress_repo.upsert(
        uid="u1",
        course_id="c1",
        current_lesson_index=3,
        lessons_completed=2,
        total_time_seconds=600,
    )
    assert result["id"] == "c1"
    assert result["lessons_completed"] == 2

    # Upsert again should update
    result2 = progress_repo.upsert(
        uid="u1",
        course_id="c1",
        current_lesson_index=5,
        lessons_completed=4,
    )
    assert result2["current_lesson_index"] == 5

    items = progress_repo.list_by_user("u1")
    assert len(items) >= 1


@pytest.mark.requires_emulator
def test_uploaded_documents_repo() -> None:
    from app.db import uploaded_documents as docs_repo

    doc = docs_repo.create(
        user_id="u1",
        filename="test.pdf",
        gcs_path="local://test.pdf",
        extracted_text="Hello world",
        content_type="application/pdf",
    )
    assert doc["id"]
    assert doc["filename"] == "test.pdf"

    items = docs_repo.list_by_user("u1")
    assert any(d["id"] == doc["id"] for d in items)


# ── API Router imports ───────────────────────────────────────────────────────


def test_all_api_routers_importable() -> None:
    """Verify all API router modules can be imported."""
    from app.api import (
        admin,
        conversations,
        courses,
        documents,
        languages,
        progress,
        topics,
    )
    from app.auth import router as auth_router_mod

    for mod in [
        admin,
        conversations,
        courses,
        documents,
        languages,
        progress,
        topics,
        auth_router_mod,
    ]:
        assert hasattr(mod, "router")
