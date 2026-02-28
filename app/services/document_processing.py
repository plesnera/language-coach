"""Document upload and text extraction.

Supports PDF, DOCX, TXT, and MD files.  In LOCAL_DEV mode files are saved
to the local filesystem; in production they go to a GCS bucket.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}
_UPLOAD_BUCKET = os.environ.get(
    "UPLOAD_BUCKET", "language-coach-uploads"
)
_LOCAL_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from *file_bytes* based on the file extension."""
    ext = _ext(filename)
    if ext in (".txt", ".md"):
        return file_bytes.decode("utf-8", errors="replace")
    if ext == ".pdf":
        return _extract_pdf(file_bytes)
    if ext == ".docx":
        return _extract_docx(file_bytes)
    raise ValueError(f"Unsupported file type: {ext}")


def _extract_pdf(data: bytes) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    pages = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(pages)


def _extract_docx(data: bytes) -> str:
    import io

    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


# ---------------------------------------------------------------------------
# File storage
# ---------------------------------------------------------------------------


def save_upload(user_id: str, filename: str, file_bytes: bytes) -> str:
    """Persist the raw upload and return a storage path/URI."""
    ext = _ext(filename)
    unique_name = f"{uuid.uuid4().hex}{ext}"

    if _LOCAL_DEV:
        return _save_local(user_id, unique_name, file_bytes)
    return _save_gcs(user_id, unique_name, file_bytes)


def _save_local(user_id: str, unique_name: str, data: bytes) -> str:
    dest_dir = _LOCAL_UPLOAD_DIR / user_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / unique_name
    dest.write_bytes(data)
    return str(dest)


def _save_gcs(user_id: str, unique_name: str, data: bytes) -> str:
    from google.cloud import storage

    client = storage.Client()
    bucket = client.bucket(_UPLOAD_BUCKET)
    blob_path = f"{user_id}/{unique_name}"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(data)
    return f"gs://{_UPLOAD_BUCKET}/{blob_path}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_extension(filename: str) -> None:
    """Raise ValueError if the file extension is not allowed."""
    ext = _ext(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"File type '{ext}' not allowed. "
            f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
