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

"""Admin-only API endpoints (``/api/admin/``)."""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from pydantic import BaseModel

from app.auth.dependencies import require_admin
from app.db import courses as courses_repo
from app.db import images as images_repo
from app.db import languages as lang_repo
from app.db import system_prompts as prompts_repo
from app.db import topics as topics_repo
from app.db import users as users_repo

router = APIRouter(
    prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)]
)


# ── Languages ───────────────────────────────────────────────────────────────


@router.get("/languages")
def list_all_languages() -> list[dict[str, Any]]:
    return lang_repo.list_all()


class CreateLanguageRequest(BaseModel):
    id: str
    name: str
    enabled: bool = True


@router.post("/languages", status_code=201)
def create_language(body: CreateLanguageRequest) -> dict[str, Any]:
    if lang_repo.get(body.id) is not None:
        raise HTTPException(409, "Language already exists")
    return lang_repo.create(body.id, body.name, body.enabled)


# ── Courses ─────────────────────────────────────────────────────────────────


@router.get("/courses")
def list_courses(language_id: str = Query(...)) -> list[dict[str, Any]]:
    return courses_repo.list_by_language(language_id)


class CreateCourseRequest(BaseModel):
    language_id: str
    title: str
    description: str
    sort_order: int = 0


@router.post("/courses", status_code=201)
def create_course(body: CreateCourseRequest) -> dict[str, Any]:
    return courses_repo.create(**body.model_dump())


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None


@router.put("/courses/{course_id}")
def update_course(course_id: str, body: UpdateCourseRequest) -> dict[str, Any]:
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    result = courses_repo.update(course_id, fields)
    if result is None:
        raise HTTPException(404, "Course not found")
    return result


@router.delete("/courses/{course_id}", status_code=204)
def delete_course(course_id: str) -> None:
    if not courses_repo.delete(course_id):
        raise HTTPException(404, "Course not found")


# ── Lessons ─────────────────────────────────────────────────────────────────


@router.get("/courses/{course_id}/lessons")
def list_lessons(course_id: str) -> list[dict[str, Any]]:
    return courses_repo.list_lessons(course_id)


class CreateLessonRequest(BaseModel):
    title: str
    objective: str
    teaching_prompt: str
    sort_order: int = 0
    source_audio_ref: str | None = None
    source_transcript: str | None = None
    image_url: str | None = None


@router.post("/courses/{course_id}/lessons", status_code=201)
def create_lesson(course_id: str, body: CreateLessonRequest) -> dict[str, Any]:
    if courses_repo.get(course_id) is None:
        raise HTTPException(404, "Course not found")
    return courses_repo.create_lesson(course_id, **body.model_dump())


class UpdateLessonRequest(BaseModel):
    title: str | None = None
    objective: str | None = None
    teaching_prompt: str | None = None
    sort_order: int | None = None
    source_audio_ref: str | None = None
    source_transcript: str | None = None
    image_url: str | None = None


@router.put("/courses/{course_id}/lessons/{lesson_id}")
def update_lesson(
    course_id: str, lesson_id: str, body: UpdateLessonRequest
) -> dict[str, Any]:
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    result = courses_repo.update_lesson(course_id, lesson_id, fields)
    if result is None:
        raise HTTPException(404, "Lesson not found")
    return result


@router.delete("/courses/{course_id}/lessons/{lesson_id}", status_code=204)
def delete_lesson(course_id: str, lesson_id: str) -> None:
    if not courses_repo.delete_lesson(course_id, lesson_id):
        raise HTTPException(404, "Lesson not found")


class ReorderLessonsRequest(BaseModel):
    lesson_ids: list[str]


@router.put("/courses/{course_id}/lessons/reorder")
def reorder_lessons(course_id: str, body: ReorderLessonsRequest) -> dict[str, str]:
    for idx, lid in enumerate(body.lesson_ids):
        courses_repo.update_lesson(course_id, lid, {"sort_order": idx})
    return {"status": "ok"}


# ── Topics ──────────────────────────────────────────────────────────────────


@router.get("/topics")
def list_topics(language_id: str = Query(...)) -> list[dict[str, Any]]:
    return topics_repo.list_by_language(language_id)


class CreateTopicRequest(BaseModel):
    language_id: str
    title: str
    description: str
    conversation_prompt: str
    sort_order: int = 0
    image_url: str | None = None


@router.post("/topics", status_code=201)
def create_topic(body: CreateTopicRequest) -> dict[str, Any]:
    return topics_repo.create(**body.model_dump())


class UpdateTopicRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    conversation_prompt: str | None = None
    sort_order: int | None = None
    image_url: str | None = None


@router.put("/topics/{topic_id}")
def update_topic(topic_id: str, body: UpdateTopicRequest) -> dict[str, Any]:
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    result = topics_repo.update(topic_id, fields)
    if result is None:
        raise HTTPException(404, "Topic not found")
    return result


@router.delete("/topics/{topic_id}", status_code=204)
def delete_topic(topic_id: str) -> None:
    if not topics_repo.delete(topic_id):
        raise HTTPException(404, "Topic not found")


# ── System Prompts ──────────────────────────────────────────────────────────


@router.get("/prompts")
def list_prompts(
    language_id: str = Query(...),
    type: str | None = Query(None),
) -> list[dict[str, Any]]:
    return prompts_repo.list_by_language(language_id, prompt_type=type)


class CreatePromptRequest(BaseModel):
    language_id: str
    type: str
    name: str
    prompt_text: str
    is_active: bool = False


@router.post("/prompts", status_code=201)
def create_prompt(body: CreatePromptRequest) -> dict[str, Any]:
    if body.type not in prompts_repo.PROMPT_TYPES:
        raise HTTPException(
            400, f"Invalid type. Must be one of {prompts_repo.PROMPT_TYPES}"
        )
    return prompts_repo.create(
        language_id=body.language_id,
        prompt_type=body.type,
        name=body.name,
        prompt_text=body.prompt_text,
        is_active=body.is_active,
    )


class UpdatePromptRequest(BaseModel):
    name: str | None = None
    prompt_text: str | None = None


@router.put("/prompts/{prompt_id}")
def update_prompt(prompt_id: str, body: UpdatePromptRequest) -> dict[str, Any]:
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    result = prompts_repo.update(prompt_id, fields)
    if result is None:
        raise HTTPException(404, "Prompt not found")
    return result


@router.post("/prompts/{prompt_id}/activate")
def activate_prompt(prompt_id: str) -> dict[str, Any]:
    result = prompts_repo.activate(prompt_id)
    if result is None:
        raise HTTPException(404, "Prompt not found")
    return result


@router.delete("/prompts/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: str) -> None:
    if not prompts_repo.delete(prompt_id):
        raise HTTPException(404, "Prompt not found")


# ── Users ───────────────────────────────────────────────────────────────────


@router.get("/users")
def list_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    return users_repo.list_all(limit=limit, offset=offset)


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.put("/users/{uid}/role")
def update_user_role(uid: str, body: UpdateUserRoleRequest) -> dict[str, Any]:
    if body.role not in ("user", "admin"):
        raise HTTPException(400, "Role must be 'user' or 'admin'")
    result = users_repo.update(uid, {"role": body.role})
    if result is None:
        raise HTTPException(404, "User not found")
    # Sync to Firebase custom claims (works with emulator in dev too)
    try:
        from firebase_admin import auth as firebase_auth

        firebase_auth.set_custom_user_claims(uid, {"role": body.role})
    except Exception:
        pass  # Non-fatal: Firestore doc is already updated
    return result


class DisableUserRequest(BaseModel):
    disabled: bool


@router.put("/users/{uid}/disable")
def disable_user(uid: str, body: DisableUserRequest) -> dict[str, Any]:
    result = users_repo.update(uid, {"disabled": body.disabled})
    if result is None:
        raise HTTPException(404, "User not found")
    return result


# ── Image Library ───────────────────────────────────────────────────────────


@router.get("/images")
def list_images() -> list[dict[str, Any]]:
    return images_repo.list_all()


@router.post("/images/upload", status_code=201)
async def upload_image(file: UploadFile) -> dict[str, Any]:
    """Upload an image file and add it to the library."""
    import os
    import uuid as _uuid
    from pathlib import Path

    ext = Path(file.filename or "image.png").suffix or ".png"
    unique_name = f"{_uuid.uuid4().hex}{ext}"
    data = await file.read()

    bucket_name = os.environ.get("IMAGES_BUCKET_NAME")
    if bucket_name:
        from google.cloud import storage
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(unique_name)
        content_type = file.content_type or "application/octet-stream"
        blob.upload_from_string(data, content_type=content_type)
        url = f"https://storage.googleapis.com/{bucket_name}/{unique_name}"
    else:
        uploads_dir = Path(__file__).resolve().parent.parent.parent / "data" / "images"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        dest = uploads_dir / unique_name
        dest.write_bytes(data)
        url = f"/uploads/images/{unique_name}"

    record = images_repo.create(
        filename=unique_name,
        url=url,
        original_name=file.filename or "unknown",
    )
    return record


# ── Transcription ───────────────────────────────────────────────────────────


@router.post("/transcribe")
async def transcribe_upload(file: UploadFile) -> dict[str, Any]:
    """Upload a single audio file and return its transcript."""
    from app.services.audio_transcription import transcribe_audio

    data = await file.read()
    transcript = transcribe_audio(data)
    return {"filename": file.filename, "transcript": transcript}


@router.post("/transcribe/batch")
def transcribe_batch(
    directory: str = Query("data/spanish/beginner/audio"),
    language_code: str = Query("es-ES"),
) -> dict[str, Any]:
    """Batch-transcribe all MP3 files in *directory*."""
    from pathlib import Path

    from app.services.audio_transcription import transcribe_file

    audio_dir = Path(directory)
    if not audio_dir.is_dir():
        raise HTTPException(404, f"Directory not found: {directory}")

    files = sorted(audio_dir.glob("*.mp3"))
    if not files:
        raise HTTPException(404, "No MP3 files found in directory")

    results: list[dict[str, str]] = []
    for f in files:
        transcript = transcribe_file(f, language_code=language_code)
        results.append({"filename": f.name, "transcript": transcript})

    return {"count": len(results), "results": results}


# ── Summarisation ───────────────────────────────────────────────────────────


class SummariseRequest(BaseModel):
    transcript_text: str
    prompt_id: str | None = None
    prompt_text: str | None = None


@router.post("/summarise")
def summarise_transcript(body: SummariseRequest) -> dict[str, Any]:
    """Summarise transcript text using AI."""
    from app.services.summarisation import summarise

    # Resolve the prompt text: explicit text wins, else look up by prompt_id.
    prompt = body.prompt_text
    if not prompt and body.prompt_id:
        doc = prompts_repo.get(body.prompt_id)
        if doc is None:
            raise HTTPException(404, "Prompt not found")
        prompt = doc.get("prompt_text", "")
    if not prompt:
        prompt = "Summarise the following transcript."

    summary = summarise(body.transcript_text, prompt)
    return {"summary": summary}
