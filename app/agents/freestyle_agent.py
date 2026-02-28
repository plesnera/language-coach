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

"""Freestyle open-ended conversation agent (Use Case 3)."""

from __future__ import annotations

from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types

from app.agents.prompt_loader import load_prompt

DEFAULT_INSTRUCTION = (
    "You are a friendly conversational partner. Speak in Spanish. "
    "Gently correct mistakes. Adjust complexity to the user's level. "
    "If the student says 'help me', switch to English and clarify."
)


def create_freestyle_agent(language_id: str = "es") -> Agent:
    instruction = load_prompt(language_id, "freestyle", DEFAULT_INSTRUCTION)
    return Agent(
        name="freestyle_agent",
        model=Gemini(
            model="gemini-live-2.5-flash-native-audio",
            retry_options=types.HttpRetryOptions(attempts=3),
        ),
        instruction=instruction,
    )
