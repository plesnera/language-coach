# ruff: noqa
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

from google.adk.agents import Agent
from google.adk.apps import App
from google.genai import types

# Ensure environment is bootstrapped before creating agents.
import app.agents.setup
from app.agents.prompt_loader import load_prompt
from app.agents.safe_gemini import SafeGemini

root_agent = Agent(
    name="root_agent",
    model=SafeGemini(
        model="gemini-live-2.5-flash-native-audio",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=load_prompt("es", "router"),
    # tools=[],
)

app = App(root_agent=root_agent, name="app")
