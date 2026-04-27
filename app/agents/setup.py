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

"""One-time environment bootstrap shared by all agent modules."""

from __future__ import annotations

import os

import google.auth
import vertexai

# Prefer project/location from environment; fall back to google.auth.default()
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT_ID") or os.environ.get(
    "GOOGLE_CLOUD_PROJECT"
)
if not project_id:
    _, project_id = google.auth.default()

location = os.environ.get("GOOGLE_CLOUD_LOCATION", "europe-west1")

os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

vertexai.init(project=project_id, location=location)

# Default language for all agents and seed data (override via env var).
DEFAULT_LANGUAGE_ID = os.environ.get("DEFAULT_LANGUAGE_ID", "en")
