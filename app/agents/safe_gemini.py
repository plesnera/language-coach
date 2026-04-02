"""Gemini wrapper with live-connect config normalization.

ADK currently propagates live `response_modalities` as strings (e.g. "AUDIO"),
while GenAI's pydantic models expect enum values. This wrapper normalizes
modalities before the live connection is serialized.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from google.adk.models import Gemini
from google.genai import types


def normalize_live_response_modalities(live_connect_config: Any) -> None:
    """Normalize response modalities to GenAI enum values when needed."""
    if live_connect_config is None:
        return
    modalities = getattr(live_connect_config, "response_modalities", None)
    if modalities is None:
        return

    if isinstance(modalities, str):
        raw_modalities = [modalities]
    else:
        try:
            raw_modalities = list(modalities)
        except TypeError:
            return

    normalized_modalities: list[Any] = []
    changed = isinstance(modalities, str)
    modality_value_map = {m.value: m for m in types.Modality}
    for modality in raw_modalities:
        if isinstance(modality, str):
            changed = True
            normalized_modalities.append(
                modality_value_map.get(modality, modality)
            )
        else:
            normalized_modalities.append(modality)

    if changed:
        live_connect_config.response_modalities = normalized_modalities


class SafeGemini(Gemini):
    """Gemini model with compatibility normalization for live config."""

    @asynccontextmanager
    async def connect(self, llm_request: Any):
        normalize_live_response_modalities(
            getattr(llm_request, "live_connect_config", None)
        )
        async with super().connect(llm_request) as connection:
            yield connection
