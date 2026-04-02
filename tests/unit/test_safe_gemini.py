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

"""Unit tests for SafeGemini live modality normalization."""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

import pytest
from google.adk.models import Gemini as BaseGemini
from google.genai import types

from app.agents.safe_gemini import SafeGemini, normalize_live_response_modalities


def test_normalize_live_response_modalities_converts_string_list() -> None:
    cfg = SimpleNamespace(response_modalities=["AUDIO", "TEXT"])
    normalize_live_response_modalities(cfg)
    assert cfg.response_modalities == [types.Modality.AUDIO, types.Modality.TEXT]


def test_normalize_live_response_modalities_converts_single_string() -> None:
    cfg = SimpleNamespace(response_modalities="AUDIO")
    normalize_live_response_modalities(cfg)
    assert cfg.response_modalities == [types.Modality.AUDIO]


def test_normalize_live_response_modalities_leaves_enums_unchanged() -> None:
    cfg = SimpleNamespace(response_modalities=[types.Modality.AUDIO])
    normalize_live_response_modalities(cfg)
    assert cfg.response_modalities == [types.Modality.AUDIO]


def test_normalize_live_response_modalities_keeps_unknown_values() -> None:
    cfg = SimpleNamespace(response_modalities=["UNKNOWN", "AUDIO"])
    normalize_live_response_modalities(cfg)
    assert cfg.response_modalities[0] == "UNKNOWN"
    assert cfg.response_modalities[1] == types.Modality.AUDIO


@pytest.mark.asyncio
async def test_safe_gemini_connect_normalizes_before_parent_connect(monkeypatch) -> None:
    @asynccontextmanager
    async def fake_parent_connect(self, llm_request):
        yield "connected"

    monkeypatch.setattr(BaseGemini, "connect", fake_parent_connect)
    llm_request = SimpleNamespace(
        live_connect_config=types.LiveConnectConfig.model_construct(
            response_modalities=["AUDIO"]
        )
    )
    model = SafeGemini(model="gemini-live-2.5-flash-native-audio")

    async with model.connect(llm_request) as connection:
        assert connection == "connected"

    assert llm_request.live_connect_config.response_modalities == [types.Modality.AUDIO]
