"""Audio transcription using Google Cloud Speech-to-Text.

In LOCAL_DEV mode, returns a placeholder instead of calling GCP.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")


def transcribe_audio(
    file_bytes: bytes,
    language_code: str = "es-ES",
) -> str:
    """Transcribe audio bytes and return the transcript text."""
    if _LOCAL_DEV:
        # Development mock that simulates successful transcription
        # This allows testing the file upload flow without GCP dependencies
        return (
            f"Mock transcription successful! File size: {len(file_bytes)} bytes. "
            f"Detected language: {language_code}. "
            "This is a simulated transcript that would come from Google Cloud Speech-to-Text "
            "in production. The actual audio content would be transcribed here."
        )
    return _transcribe_gcp(file_bytes, language_code)


def transcribe_file(
    file_path: str | Path,
    language_code: str = "es-ES",
) -> str:
    """Convenience wrapper that reads a file and transcribes it."""
    data = Path(file_path).read_bytes()
    return transcribe_audio(data, language_code)


def _transcribe_gcp(audio_bytes: bytes, language_code: str) -> str:
    from google.cloud.speech_v2 import SpeechClient
    from google.cloud.speech_v2.types import cloud_speech

    client = SpeechClient()
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")

    config = cloud_speech.RecognitionConfig(
        auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
        language_codes=[language_code],
        model="chirp",
    )

    request = cloud_speech.RecognizeRequest(
        recognizer=f"projects/{project_id}/locations/global/recognizers/_",
        config=config,
        content=audio_bytes,
    )

    # For files > ~1 min the sync API may time out; fall back to LRO.
    if len(audio_bytes) > 5 * 1024 * 1024:
        return _transcribe_long(client, request, project_id, config, audio_bytes)

    response = client.recognize(request=request)
    return _results_to_text(response.results)


def _transcribe_long(
    client,
    _short_request,
    project_id: str,
    config,
    audio_bytes: bytes,
) -> str:
    from google.cloud.speech_v2.types import cloud_speech

    request = cloud_speech.BatchRecognizeRequest(
        recognizer=f"projects/{project_id}/locations/global/recognizers/_",
        config=config,
        files=[
            cloud_speech.BatchRecognizeFileMetadata(
                content=audio_bytes,
            )
        ],
        recognition_output_config=cloud_speech.RecognitionOutputConfig(
            inline_response_config=cloud_speech.InlineOutputConfig(),
        ),
    )
    operation = client.batch_recognize(request=request)
    logger.info("Waiting for long-running transcription…")
    response = operation.result(timeout=600)

    parts: list[str] = []
    for result in response.results.values():
        parts.append(_results_to_text(result.transcript.results))
    return "\n".join(parts)


def _results_to_text(results) -> str:
    parts: list[str] = []
    for result in results:
        for alt in result.alternatives:
            parts.append(alt.transcript)
    return " ".join(parts)
