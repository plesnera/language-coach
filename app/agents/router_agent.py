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

"""Root router agent — inspects user mode and delegates to sub-agents."""

from __future__ import annotations

from google.adk.agents import Agent
from google.adk.apps import App
from google.genai import types

# Ensure environment is bootstrapped before creating agents.
import app.agents.setup
from app.agents.beginner_agent import create_beginner_agent
from app.agents.freestyle_agent import create_freestyle_agent
from app.agents.prompt_loader import load_prompt
from app.agents.safe_gemini import SafeGemini
from app.agents.setup import DEFAULT_LANGUAGE_ID
from app.agents.topic_agent import create_topic_agent

def _create_router_app() -> App:
    """Build the router ADK app (hits Firestore for prompts)."""
    _beginner = create_beginner_agent(DEFAULT_LANGUAGE_ID)
    _topic = create_topic_agent(DEFAULT_LANGUAGE_ID)
    _freestyle = create_freestyle_agent(DEFAULT_LANGUAGE_ID)

    _root_agent = Agent(
        name="root_agent",
        model=SafeGemini(
            model="gemini-live-2.5-flash-native-audio",
            retry_options=types.HttpRetryOptions(attempts=3),
        ),
        instruction=load_prompt(DEFAULT_LANGUAGE_ID, "router"),
        sub_agents=[_beginner, _topic, _freestyle],
    )
    return App(root_agent=_root_agent, name="app")


def get_app() -> App:
    """Lazily create and cache the router ADK app."""
    if not hasattr(get_app, "_cached"):
        get_app._cached = _create_router_app()
    return get_app._cached


def __getattr__(name: str):
    """Lazy module-level attributes for backward compatibility."""
    if name == "root_agent":
        return get_app().root_agent
    if name == "app":
        return get_app()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
