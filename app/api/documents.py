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

"""User-facing document endpoints (``/api/documents/``)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.auth.dependencies import get_current_user
from app.db import uploaded_documents as docs_repo
from app.services.document_processing import (
    extract_text,
    save_upload,
    validate_extension,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

_MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get("/")
def list_my_documents(
    user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    return docs_repo.list_by_user(user["uid"])


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Upload a document (PDF, TXT, MD, DOCX) and extract its text."""
    filename = file.filename or "upload"
    try:
        validate_extension(filename)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_UPLOAD_SIZE:
        raise HTTPException(400, "File too large (max 10 MB)")

    try:
        text = extract_text(file_bytes, filename)
    except Exception as exc:
        logger.exception("Text extraction failed for %s", filename)
        raise HTTPException(500, f"Could not extract text: {exc}") from exc

    gcs_path = save_upload(user["uid"], filename, file_bytes)

    doc = docs_repo.create(
        user_id=user["uid"],
        filename=filename,
        gcs_path=gcs_path,
        extracted_text=text,
        content_type=file.content_type or "application/octet-stream",
    )
    return {
        "id": doc["id"],
        "filename": filename,
        "preview": text[:500],
    }
