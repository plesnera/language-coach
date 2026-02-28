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

"""Beginner dialogue-track agent (Use Case 1)."""

from __future__ import annotations

from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types

from app.agents.prompt_loader import load_prompt

DEFAULT_INSTRUCTION = (
    "You are a patient Spanish teacher for complete beginners. "
    "Teach through a Socratic dialogue: explain a concept briefly, give "
    "examples in Spanish with English translations, then ask the student "
    "to try constructing a sentence. Correct mistakes gently and encourage "
    "the student. Keep exercises simple and build on previous knowledge. "
    "If the student says 'help me', switch to English and clarify."
)


def create_beginner_agent(language_id: str = "es") -> Agent:
    instruction = load_prompt(language_id, "beginner", DEFAULT_INSTRUCTION)
    return Agent(
        name="beginner_agent",
        model=Gemini(
            model="gemini-live-2.5-flash-native-audio",
            retry_options=types.HttpRetryOptions(attempts=3),
        ),
        instruction=instruction,
    )
