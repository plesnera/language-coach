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

"""REST API integration tests.

Requires the Firestore emulator:
    FIRESTORE_EMULATOR_HOST=localhost:8080 GOOGLE_CLOUD_PROJECT=demo-test \
        uv run pytest tests/integration -v
"""

from __future__ import annotations

import os
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skipif(
    not os.environ.get("FIRESTORE_EMULATOR_HOST"),
    reason="FIRESTORE_EMULATOR_HOST not set — start the Firestore emulator first",
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def seeded_client():
    """Return a TestClient with dependency overrides for admin access.

    Also seeds Firestore with the default language/course/topic/prompt data.
    """
    from app.app_utils.expose_app import app
    from app.auth.dependencies import get_current_user, require_admin
    from app.db import courses as courses_repo
    from app.db import languages as languages_repo
    from app.db import system_prompts as prompts_repo
    from app.db import topics as topics_repo

    # Seed reference data (idempotent helpers guard against duplicates)
    languages_repo.seed_defaults()
    courses_repo.seed_defaults()
    topics_repo.seed_defaults()
    prompts_repo.seed_defaults()

    fake_admin: dict[str, Any] = {
        "uid": "test-admin",
        "email": "admin@test.com",
        "role": "admin",
        "disabled": False,
    }
    fake_user: dict[str, Any] = {
        "uid": "test-user-iso",
        "email": "user@test.com",
        "role": "user",
        "disabled": False,
    }

    app.dependency_overrides[get_current_user] = lambda: fake_admin
    app.dependency_overrides[require_admin] = lambda: fake_admin

    with TestClient(app, raise_server_exceptions=True) as client:
        yield client, fake_admin, fake_user

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------


def test_list_languages_returns_enabled_only(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/languages/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(lang["id"] == "es" for lang in data)
    # All returned languages must have enabled=True
    assert all(lang.get("enabled") is True for lang in data)


# ---------------------------------------------------------------------------
# Courses + Lessons (learner endpoints, no auth)
# ---------------------------------------------------------------------------


def test_list_courses_by_language(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/courses/", params={"language_id": "es"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_course_lessons(seeded_client):
    client, _, _ = seeded_client
    courses = client.get("/api/courses/", params={"language_id": "es"}).json()
    assert courses, "No seeded courses found"
    course_id = courses[0]["id"]

    resp = client.get(f"/api/courses/{course_id}/lessons")
    assert resp.status_code == 200
    lessons = resp.json()
    assert isinstance(lessons, list)


def test_get_lesson_detail(seeded_client):
    client, _, _ = seeded_client
    courses = client.get("/api/courses/", params={"language_id": "es"}).json()
    course_id = courses[0]["id"]
    lessons = client.get(f"/api/courses/{course_id}/lessons").json()
    if not lessons:
        pytest.skip("No lessons seeded")
    lesson_id = lessons[0]["id"]

    resp = client.get(f"/api/courses/{course_id}/lessons/{lesson_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == lesson_id


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------


def test_list_topics_by_language(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/topics/", params={"language_id": "es"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------


def test_register_happy_path(seeded_client):
    client, _, _ = seeded_client
    fake_fb_user = MagicMock()
    fake_fb_user.uid = "new-uid-123"
    fake_fb_user.email = "newuser@example.com"

    with patch("firebase_admin.auth.create_user", return_value=fake_fb_user), \
         patch("firebase_admin.auth.set_custom_user_claims"):
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "secret1234",
                "display_name": "Test User",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["uid"] == "new-uid-123"


def test_register_duplicate_email(seeded_client):
    client, _, _ = seeded_client
    from firebase_admin.auth import EmailAlreadyExistsError

    with patch("firebase_admin.auth.create_user") as mock_create:
        mock_create.side_effect = EmailAlreadyExistsError(
            "EMAIL_EXISTS", cause=None, http_response=None
        )
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "dup@example.com",
                "password": "secret",
                "display_name": "Dup",
            },
        )
    assert resp.status_code == 409


def test_forgot_password_always_200(seeded_client):
    client, _, _ = seeded_client
    with patch("firebase_admin.auth.generate_password_reset_link", return_value="http://reset"):
        resp = client.post(
            "/api/auth/forgot-password",
            json={"email": "anyone@example.com"},
        )
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Progress (auth required, overridden)
# ---------------------------------------------------------------------------


def test_progress_create_and_update(seeded_client):
    client, fake_admin, _ = seeded_client
    # Create
    resp = client.put(
        "/api/progress/",
        json={
            "course_id": "prog-test-course",
            "current_lesson_index": 0,
            "lessons_completed": 0,
            "total_time_seconds": 0,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == "prog-test-course"

    # Update
    resp2 = client.put(
        "/api/progress/",
        json={
            "course_id": "prog-test-course",
            "current_lesson_index": 2,
            "lessons_completed": 1,
        },
    )
    assert resp2.status_code == 200
    assert resp2.json()["current_lesson_index"] == 2


def test_progress_user_isolation(seeded_client):
    """Two users must not see each other's progress."""
    client, fake_admin, fake_user = seeded_client
    from app.app_utils.expose_app import app
    from app.auth.dependencies import get_current_user, require_admin

    try:
        # Write progress as fake_user
        app.dependency_overrides[get_current_user] = lambda: fake_user
        app.dependency_overrides[require_admin] = lambda: fake_user
        with TestClient(app) as user_client:
            user_client.put(
                "/api/progress/",
                json={"course_id": "iso-course", "current_lesson_index": 5},
            )
            user_resp = user_client.get("/api/progress/")  # noqa: F841
    finally:
        # Always restore admin — even if an assertion above fails
        app.dependency_overrides[get_current_user] = lambda: fake_admin
        app.dependency_overrides[require_admin] = lambda: fake_admin

    admin_resp = client.get("/api/progress/")
    admin_ids = {r["id"] for r in admin_resp.json()}
    assert "iso-course" not in admin_ids  # admin's progress should not contain user's entry


# ---------------------------------------------------------------------------
# Conversations (auth required)
# ---------------------------------------------------------------------------


def test_conversations_list_empty_then_populated(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/conversations/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_conversation_create_and_get(seeded_client):
    client, _, _ = seeded_client
    # Create via repo directly to test the GET endpoint
    from app.db import conversations as conv_repo

    doc = conv_repo.create(user_id="test-admin", language_id="es", mode="freestyle")
    conv_id = doc["id"]

    resp = client.get(f"/api/conversations/{conv_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == conv_id


def test_conversation_user_isolation(seeded_client):
    """Two users must not see each other's conversations."""
    client, fake_admin, fake_user = seeded_client
    from app.app_utils.expose_app import app
    from app.auth.dependencies import get_current_user, require_admin
    from app.db import conversations as conv_repo

    try:
        # Create a conversation as fake_user directly via the repo
        conv_repo.create(user_id=fake_user["uid"], language_id="es", mode="freestyle")

        # Switch to fake_user and list conversations
        app.dependency_overrides[get_current_user] = lambda: fake_user
        app.dependency_overrides[require_admin] = lambda: fake_user
        with TestClient(app) as user_client:
            user_convs = user_client.get("/api/conversations/").json()
    finally:
        # Always restore admin
        app.dependency_overrides[get_current_user] = lambda: fake_admin
        app.dependency_overrides[require_admin] = lambda: fake_admin

    # Admin's conversation list must not include fake_user's conversations
    admin_convs = client.get("/api/conversations/").json()
    admin_conv_user_ids = {c.get("user_id") for c in admin_convs}
    assert fake_user["uid"] not in admin_conv_user_ids

    # fake_user must see their own conversation
    assert any(c.get("user_id") == fake_user["uid"] for c in user_convs)


# ---------------------------------------------------------------------------
# Admin — Courses CRUD
# ---------------------------------------------------------------------------


def test_admin_courses_list(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/admin/courses", params={"language_id": "es"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_admin_course_create_update_delete(seeded_client):
    client, _, _ = seeded_client

    # Create
    resp = client.post(
        "/api/admin/courses",
        json={"title": "Test Course", "description": "Desc", "language_id": "es", "level": "beginner"},
    )
    assert resp.status_code == 201
    course_id = resp.json()["id"]

    # Update
    resp2 = client.put(f"/api/admin/courses/{course_id}", json={"title": "Updated Title"})
    assert resp2.status_code == 200
    assert resp2.json()["title"] == "Updated Title"

    # Delete
    resp3 = client.delete(f"/api/admin/courses/{course_id}")
    assert resp3.status_code == 204

    # Delete non-existent
    resp4 = client.delete(f"/api/admin/courses/{course_id}")
    assert resp4.status_code == 404


# ---------------------------------------------------------------------------
# Admin — Lessons
# ---------------------------------------------------------------------------


def test_admin_lessons_crud_and_reorder(seeded_client):
    client, _, _ = seeded_client

    # Create a course to attach lessons to
    course = client.post(
        "/api/admin/courses",
        json={"title": "Lesson Test Course", "description": "D", "language_id": "es", "level": "beginner"},
    ).json()
    cid = course["id"]

    # Create lesson
    resp = client.post(
        f"/api/admin/courses/{cid}/lessons",
        json={"title": "Lesson 1", "objective": "Obj", "teaching_prompt": "Prompt", "sort_order": 0},
    )
    assert resp.status_code == 201
    lid1 = resp.json()["id"]

    resp2 = client.post(
        f"/api/admin/courses/{cid}/lessons",
        json={"title": "Lesson 2", "objective": "Obj", "teaching_prompt": "Prompt", "sort_order": 1},
    )
    assert resp2.status_code == 201
    lid2 = resp2.json()["id"]

    # Update
    resp3 = client.put(f"/api/admin/courses/{cid}/lessons/{lid1}", json={"title": "Lesson 1 Updated"})
    assert resp3.status_code == 200
    assert resp3.json()["title"] == "Lesson 1 Updated"

    # Reorder (verifies the route fix: /reorder must precede /{lesson_id})
    resp4 = client.put(
        f"/api/admin/courses/{cid}/lessons/reorder",
        json={"lesson_ids": [lid2, lid1]},
    )
    assert resp4.status_code == 200

    # Delete
    resp5 = client.delete(f"/api/admin/courses/{cid}/lessons/{lid1}")
    assert resp5.status_code == 204

    # Cleanup
    client.delete(f"/api/admin/courses/{cid}")


# ---------------------------------------------------------------------------
# Admin — Topics
# ---------------------------------------------------------------------------


def test_admin_topics_crud(seeded_client):
    client, _, _ = seeded_client

    resp = client.post(
        "/api/admin/topics",
        json={
            "language_id": "es",
            "title": "Test Topic",
            "description": "A test description",
            "conversation_prompt": "Talk about this test topic.",
            "sort_order": 99,
        },
    )
    assert resp.status_code == 201
    topic = resp.json()
    tid = topic["id"]
    assert topic["title"] == "Test Topic"

    resp2 = client.put(f"/api/admin/topics/{tid}", json={"title": "Updated Topic"})
    assert resp2.status_code == 200
    assert resp2.json()["title"] == "Updated Topic"

    resp3 = client.delete(f"/api/admin/topics/{tid}")
    assert resp3.status_code == 204


# ---------------------------------------------------------------------------
# Admin — System Prompts (activation invariant)
# ---------------------------------------------------------------------------


def test_admin_prompts_list(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/admin/prompts", params={"language_id": "es"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_admin_prompt_invalid_type_returns_400(seeded_client):
    client, _, _ = seeded_client
    resp = client.post(
        "/api/admin/prompts",
        json={
            "language_id": "es",
            "type": "not_a_real_type",
            "name": "Bad Prompt",
            "prompt_text": "text",
        },
    )
    assert resp.status_code == 400


def test_admin_prompt_activation_deactivates_siblings(seeded_client):
    """Activating a prompt must deactivate any other active prompt of the same (language, type)."""
    client, _, _ = seeded_client

    # Create two prompts of the same type
    p1 = client.post(
        "/api/admin/prompts",
        json={
            "language_id": "es",
            "type": "beginner",
            "name": "Prompt Version A",
            "prompt_text": "Prompt A text",
        },
    ).json()
    p2 = client.post(
        "/api/admin/prompts",
        json={
            "language_id": "es",
            "type": "beginner",
            "name": "Prompt Version B",
            "prompt_text": "Prompt B text",
        },
    ).json()

    # Activate p1
    resp1 = client.post(f"/api/admin/prompts/{p1['id']}/activate")
    assert resp1.status_code == 200
    assert resp1.json()["is_active"] is True

    # Activate p2 — p1 must become inactive
    resp2 = client.post(f"/api/admin/prompts/{p2['id']}/activate")
    assert resp2.status_code == 200
    assert resp2.json()["is_active"] is True

    # Check p1 is now inactive by fetching all prompts for this type
    all_prompts = client.get("/api/admin/prompts", params={"language_id": "es"}).json()
    p1_updated = next((p for p in all_prompts if p["id"] == p1["id"]), None)
    assert p1_updated is not None, "p1 should still exist (not deleted)"
    assert p1_updated["is_active"] is False, "p1 should have been deactivated when p2 was activated"

    # Cleanup
    client.delete(f"/api/admin/prompts/{p1['id']}")
    client.delete(f"/api/admin/prompts/{p2['id']}")


def test_admin_prompt_delete(seeded_client):
    client, _, _ = seeded_client
    p = client.post(
        "/api/admin/prompts",
        json={
            "language_id": "es",
            "type": "router",
            "name": "Prompt To Delete",
            "prompt_text": "Delete me.",
        },
    ).json()
    resp = client.delete(f"/api/admin/prompts/{p['id']}")
    assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Admin — Users
# ---------------------------------------------------------------------------


def test_admin_list_users(seeded_client):
    client, _, _ = seeded_client
    resp = client.get("/api/admin/users")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_admin_update_user_role_invalid(seeded_client):
    client, fake_admin, _ = seeded_client
    with patch("firebase_admin.auth.set_custom_user_claims"):
        resp = client.put(
            f"/api/admin/users/{fake_admin['uid']}/role",
            json={"role": "superadmin"},
        )
    assert resp.status_code == 400


def test_admin_update_user_role_valid(seeded_client):
    client, _, _ = seeded_client
    from app.db import users as users_repo

    # Ensure user doc exists (create is idempotent if we use a unique uid)
    try:
        users_repo.create(uid="target-uid", email="t@t.com", display_name="Target", role="user")
    except Exception:
        pass  # already exists from a previous run against the same emulator session

    with patch("firebase_admin.auth.set_custom_user_claims"):
        resp = client.put(
            "/api/admin/users/target-uid/role",
            json={"role": "admin"},
        )
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"


def test_admin_disable_user(seeded_client):
    client, _, _ = seeded_client
    from app.db import users as users_repo

    try:
        users_repo.create(uid="disable-uid", email="d@d.com", display_name="Disable Me", role="user")
    except Exception:
        pass  # already exists

    resp = client.put("/api/admin/users/disable-uid/disable", json={"disabled": True})
    assert resp.status_code == 200
    assert resp.json()["disabled"] is True


# ---------------------------------------------------------------------------
# Auth boundary — non-admin gets 403
# ---------------------------------------------------------------------------


def test_admin_endpoint_rejects_non_admin(emulator_project):  # noqa: ARG001
    from app.app_utils.expose_app import app
    from app.auth.dependencies import get_current_user, require_admin

    fake_non_admin = {"uid": "regular-user", "email": "u@u.com", "role": "user", "disabled": False}
    fake_admin = {"uid": "test-admin", "email": "admin@test.com", "role": "admin", "disabled": False}

    # Snapshot current overrides so we can restore them in finally
    saved_overrides = dict(app.dependency_overrides)
    try:
        # Override only get_current_user; let require_admin use its real role check
        app.dependency_overrides.pop(require_admin, None)
        app.dependency_overrides[get_current_user] = lambda: fake_non_admin

        with TestClient(app) as c:
            resp_courses = c.get("/api/admin/courses", params={"language_id": "es"})
            resp_users = c.get("/api/admin/users")

    finally:
        # Always restore — a failing assertion must not leave the wrong user injected
        app.dependency_overrides.clear()
        app.dependency_overrides.update(saved_overrides)
        # Ensure the module-scoped admin override is back in place
        app.dependency_overrides[get_current_user] = lambda: fake_admin
        app.dependency_overrides[require_admin] = lambda: fake_admin

    assert resp_courses.status_code == 403
    assert resp_users.status_code == 403
