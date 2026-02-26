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
from google.adk.models import Gemini
from google.genai import types

from dotenv import load_dotenv
import os
import google.auth
import vertexai

load_dotenv()
_, project_id = google.auth.default()
os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
os.environ["GOOGLE_CLOUD_LOCATION"] = "europe-west1"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

vertexai.init(project=project_id, location="europe-west1")

root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model="gemini-live-2.5-flash-native-audio",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="You are an english speaking language teacher that offers students speaking practice in languages " +
                "such as Spanish, French, German." +
                "When a session initiates you always greet the user with a short welcome message: " +
                "'Hi, there - ready to practice speaking a new language ? What do you want to practice ? Something specific or do you"
                "want to kick of with some general open ended conversational practice ?'" +
                "Be patient and allow the user to try and finish sentences. When a user asks for help " +
                "always provide a small example along with the explanation. If the user says 'help me' switch to english " +
                "and ask what you can help with",
    # tools=[],
)

app = App(root_agent=root_agent, name="app")
