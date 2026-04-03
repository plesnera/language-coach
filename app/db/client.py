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

"""Provides a shared Firestore client instance.

When ``FIRESTORE_EMULATOR_HOST`` is set the Firestore SDK automatically
routes all traffic to the emulator, so no special branch is needed for
local development.
"""

from __future__ import annotations

import os
from typing import Any

_client: Any = None


def get_firestore_client() -> Any:
    """Return a module-level Firestore client (created once).

    If ``FIRESTORE_EMULATOR_HOST`` is set, the SDK connects to the
    Firestore emulator automatically.
    """
    global _client
    if _client is None:
        from google.cloud import firestore

        project = os.environ.get("GOOGLE_CLOUD_PROJECT_ID") or os.environ.get(
            "GOOGLE_CLOUD_PROJECT"
        )
        if project:
            os.environ["GOOGLE_CLOUD_PROJECT_ID"] = project
            os.environ["GOOGLE_CLOUD_PROJECT"] = project
        _client = firestore.Client(project=project)
    return _client
