"""AI-powered transcript summarisation using Gemini.

In LOCAL_DEV mode, returns a placeholder instead of calling the API.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")


def summarise(transcript_text: str, prompt_text: str) -> str:
    """Generate a summary of *transcript_text* guided by *prompt_text*."""
    if _LOCAL_DEV:
        return (
            "[LOCAL_DEV] AI summarisation requires a Gemini API key. "
            "Run without LOCAL_DEV to summarise."
        )
    return _summarise_gemini(transcript_text, prompt_text)


def _summarise_gemini(transcript_text: str, prompt_text: str) -> str:
    from google import genai

    client = genai.Client()
    full_prompt = f"{prompt_text}\n\n---\nTranscript:\n{transcript_text}"

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=full_prompt,
    )
    return response.text or ""
