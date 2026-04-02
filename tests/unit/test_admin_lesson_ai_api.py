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

"""Unit tests for admin lesson AI endpoints and metadata request forwarding."""

from __future__ import annotations

from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def admin_client():
    from app.app_utils.expose_app import app
    from app.auth.dependencies import get_current_user, require_admin

    fake_admin: dict[str, Any] = {
        "uid": "test-admin",
        "email": "admin@test.com",
        "role": "admin",
        "disabled": False,
    }

    app.dependency_overrides[get_current_user] = lambda: fake_admin
    app.dependency_overrides[require_admin] = lambda: fake_admin
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client
    app.dependency_overrides.clear()


def test_admin_create_lesson_forwards_metadata_fields(admin_client):
    mocked_created = {
        "id": "lesson-1",
        "title": "Lesson",
        "objective": "Objective",
        "teaching_prompt": "Prompt",
        "prompt_version": 1,
        "prompt_source_type": "ai-assisted",
        "prompt_design_notes": "Generated draft",
        "prompt_last_edited_by": "admin@test.com",
        "visual_aids": [{"type": "table", "title": "T", "description": "D", "data": {}}],
        "ai_generation_context": {
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 10,
            "focus_skills": ["speaking"],
            "constraints": None,
        },
    }

    with (
        patch("app.api.admin.courses_repo.get", return_value={"id": "course-1"}),
        patch("app.api.admin.courses_repo.create_lesson", return_value=mocked_created) as mock_create,
    ):
        resp = admin_client.post(
            "/api/admin/courses/course-1/lessons",
            json={
                "title": "Lesson",
                "objective": "Objective",
                "teaching_prompt": "Prompt",
                "sort_order": 0,
                "prompt_version": 1,
                "prompt_last_edited_by": "admin@test.com",
                "prompt_source_type": "ai-assisted",
                "prompt_design_notes": "Generated draft",
                "visual_aids": [
                    {
                        "type": "table",
                        "title": "T",
                        "description": "D",
                        "data": {},
                    }
                ],
                "ai_generation_context": {
                    "language_id": "es",
                    "learner_level": "beginner",
                    "lesson_length_minutes": 10,
                    "focus_skills": ["speaking"],
                    "constraints": None,
                },
            },
        )

    assert resp.status_code == 201
    args = mock_create.call_args.args
    kwargs = mock_create.call_args.kwargs
    assert args[0] == "course-1"
    assert kwargs["prompt_version"] == 1
    assert kwargs["prompt_source_type"] == "ai-assisted"
    assert kwargs["prompt_last_edited_by"] == "admin@test.com"
    assert kwargs["prompt_design_notes"] == "Generated draft"
    assert kwargs["visual_aids"][0]["type"] == "table"
    assert kwargs["ai_generation_context"]["learner_level"] == "beginner"


def test_admin_update_lesson_forwards_metadata_fields(admin_client):
    mocked_updated = {
        "id": "lesson-1",
        "title": "Lesson updated",
        "prompt_version": 2,
        "prompt_design_notes": "Refined",
        "visual_aids": [{"type": "diagram", "title": "Map", "description": "Word order", "data": {}}],
    }
    with patch(
        "app.api.admin.courses_repo.update_lesson", return_value=mocked_updated
    ) as mock_update:
        resp = admin_client.put(
            "/api/admin/courses/course-1/lessons/lesson-1",
            json={
                "title": "Lesson updated",
                "prompt_version": 2,
                "prompt_design_notes": "Refined",
                "visual_aids": [
                    {
                        "type": "diagram",
                        "title": "Map",
                        "description": "Word order",
                        "data": {},
                    }
                ],
            },
        )

    assert resp.status_code == 200
    args = mock_update.call_args.args
    assert args[0] == "course-1"
    assert args[1] == "lesson-1"
    assert args[2]["prompt_version"] == 2
    assert args[2]["prompt_design_notes"] == "Refined"
    assert args[2]["visual_aids"][0]["type"] == "diagram"


def test_admin_lessons_ai_draft_success_and_normalization(admin_client):
    mocked = {
        "title": "Draft lesson",
        "objective": "Practice short dialogues.",
        "teaching_prompt": "System prompt",
        "prompt_design_notes": "AI-generated",
        "visual_aids": [],
        "ai_generation_context": {
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 12,
            "focus_skills": ["speaking"],
            "constraints": "Use A1 vocabulary",
        },
    }
    with patch("app.api.admin.generate_lesson_draft", return_value=mocked) as mock_gen:
        resp = admin_client.post(
            "/api/admin/lessons/ai/draft",
            json={
                "source_content": "  source text  ",
                "language_id": " es ",
                "learner_level": " beginner ",
                "lesson_length_minutes": 12,
                "focus_skills": [" speaking ", "  "],
                "constraints": " keep short ",
            },
        )

    assert resp.status_code == 200
    kwargs = mock_gen.call_args.kwargs
    assert kwargs["source_content"] == "source text"
    assert kwargs["language_id"] == "es"
    assert kwargs["learner_level"] == "beginner"
    assert kwargs["focus_skills"] == ["speaking"]
    assert kwargs["constraints"] == "keep short"


def test_admin_lessons_ai_draft_validation_errors(admin_client):
    empty_source = admin_client.post(
        "/api/admin/lessons/ai/draft",
        json={
            "source_content": " ",
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 10,
            "focus_skills": ["speaking"],
        },
    )
    assert empty_source.status_code == 422
    assert "source_content cannot be empty" in empty_source.json()["detail"]

    invalid_length = admin_client.post(
        "/api/admin/lessons/ai/draft",
        json={
            "source_content": "x",
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 0,
            "focus_skills": ["speaking"],
        },
    )
    assert invalid_length.status_code == 422
    assert "lesson_length_minutes must be between 1 and 180" in invalid_length.json()[
        "detail"
    ]

    empty_skills = admin_client.post(
        "/api/admin/lessons/ai/draft",
        json={
            "source_content": "x",
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 10,
            "focus_skills": [" "],
        },
    )
    assert empty_skills.status_code == 422
    assert "focus_skills must include at least one skill" in empty_skills.json()[
        "detail"
    ]


def test_admin_lessons_ai_refine_success_and_validation(admin_client):
    mocked = {
        "title": "Refined lesson",
        "objective": "Updated objective",
        "teaching_prompt": "Updated prompt",
        "prompt_design_notes": "Refined",
        "visual_aids": [],
        "ai_generation_context": {
            "language_id": "es",
            "learner_level": "beginner",
            "lesson_length_minutes": 10,
            "focus_skills": ["speaking"],
            "constraints": None,
        },
    }

    with patch("app.api.admin.refine_lesson_draft", return_value=mocked) as mock_ref:
        resp = admin_client.post(
            "/api/admin/lessons/ai/refine",
            json={
                "current_draft": mocked,
                "admin_instruction": "  Make it simpler.  ",
                "conversation_summary": "  draft created ",
            },
        )
    assert resp.status_code == 200
    kwargs = mock_ref.call_args.kwargs
    assert kwargs["admin_instruction"] == "Make it simpler."
    assert kwargs["conversation_summary"] == "draft created"

    empty_instruction = admin_client.post(
        "/api/admin/lessons/ai/refine",
        json={"current_draft": {"title": "x"}, "admin_instruction": "   "},
    )
    assert empty_instruction.status_code == 422
    assert "admin_instruction cannot be empty" in empty_instruction.json()["detail"]

    long_instruction = admin_client.post(
        "/api/admin/lessons/ai/refine",
        json={"current_draft": {"title": "x"}, "admin_instruction": "a" * 5001},
    )
    assert long_instruction.status_code == 422
    assert "admin_instruction exceeds maximum size" in long_instruction.json()["detail"]
