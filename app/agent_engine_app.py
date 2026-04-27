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
import logging
import os
from typing import Any

import vertexai
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.artifacts import GcsArtifactService, InMemoryArtifactService
from google.cloud import logging as google_cloud_logging
from vertexai.agent_engines.templates.adk import AdkApp
from vertexai.preview.reasoning_engines import AdkApp as PreviewAdkApp

from app.agents.router_agent import get_app as _get_router_app
from app.app_utils.feedback_typing import Feedback
from app.app_utils.telemetry import setup_telemetry


# Placeholder app to satisfy AdkApp.__init__ validation without hitting Firestore.
# The real app is swapped in during set_up().
_PLACEHOLDER_APP = App(
    root_agent=Agent(name="placeholder", model="gemini-2.0-flash"),
    name="placeholder_app",
)


class AgentEngineApp(AdkApp):
    def _ensure_app(self) -> None:
        """Lazy-load the wrapped ADK app to avoid Firestore at import time."""
        if self._tmpl_attrs.get("app") is _PLACEHOLDER_APP:
            self._tmpl_attrs["app"] = _get_router_app()

    def set_up(self) -> None:
        """Initialize the agent engine app with logging and telemetry."""
        self._ensure_app()
        vertexai.init()
        setup_telemetry()
        super().set_up()
        logging.basicConfig(level=logging.INFO)
        logging_client = google_cloud_logging.Client()
        self.logger = logging_client.logger(__name__)
        if gemini_location:
            os.environ["GOOGLE_CLOUD_LOCATION"] = gemini_location

    def register_feedback(self, feedback: dict[str, Any]) -> None:
        """Collect and log feedback."""
        feedback_obj = Feedback.model_validate(feedback)
        self.logger.log_struct(feedback_obj.model_dump(), severity="INFO")

    def register_operations(self) -> dict[str, list[str]]:
        """Registers the operations of the Agent."""
        operations = super().register_operations()
        operations[""] = operations.get("", []) + ["register_feedback"]
        # Add bidi_stream_query for adk_live
        operations["bidi_stream"] = ["bidi_stream_query"]
        return operations


# Add bidi_stream_query support from preview AdkApp for adk_live
AgentEngineApp.bidi_stream_query = PreviewAdkApp.bidi_stream_query


gemini_location = os.environ.get("GOOGLE_CLOUD_LOCATION")
logs_bucket_name = os.environ.get("LOGS_BUCKET_NAME")
agent_engine = AgentEngineApp(
    app=_PLACEHOLDER_APP,
    artifact_service_builder=lambda: (
        GcsArtifactService(bucket_name=logs_bucket_name)
        if logs_bucket_name
        else InMemoryArtifactService()
    ),
)
