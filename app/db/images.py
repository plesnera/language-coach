"""Repository for the ``lesson_images`` collection (image library)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_document import DocumentSnapshot

from app.db.client import get_firestore_client

COLLECTION = "lesson_images"


def _doc_to_dict(doc: DocumentSnapshot) -> dict[str, Any] | None:
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def list_all() -> list[dict[str, Any]]:
    """Return every image in the library, newest first."""
    db = get_firestore_client()
    docs = (
        db.collection(COLLECTION)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return [d for doc in docs if (d := _doc_to_dict(doc)) is not None]


def create(filename: str, url: str, original_name: str) -> dict[str, Any]:
    db = get_firestore_client()
    now = datetime.now(timezone.utc)
    data: dict[str, Any] = {
        "filename": filename,
        "url": url,
        "original_name": original_name,
        "created_at": now,
    }
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}


def get_or_upload_seed_image(local_filename: str) -> str:
    """Helper to get a public URL for a seed image, uploading to GCS if configured."""
    import os
    from pathlib import Path

    bucket_name = os.environ.get("IMAGES_BUCKET_NAME")
    if not bucket_name:
        return f"/uploads/images/{local_filename}"

    from google.cloud import storage

    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(local_filename)

    if not blob.exists():
        uploads_dir = Path(__file__).resolve().parent.parent.parent / "data" / "images"
        local_path = uploads_dir / local_filename
        if local_path.exists():
            blob.upload_from_filename(str(local_path), content_type="image/jpeg")

    return f"https://storage.googleapis.com/{bucket_name}/{local_filename}"
