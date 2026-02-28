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

When the environment variable ``LOCAL_DEV=true`` is set the module returns
an in-memory store instead of a real Firestore client, so the application
can run fully offline without GCP credentials.
"""

from __future__ import annotations

import os
from typing import Any

_client: Any = None

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")


def get_firestore_client() -> Any:
    """Return a module-level Firestore client (created once).

    In local-dev mode an in-memory store is used instead.
    """
    global _client
    if _client is None:
        if _LOCAL_DEV:
            from app.db.memory_store import MemoryClient

            _client = MemoryClient()
        else:
            from google.cloud import firestore

            _client = firestore.Client()
    return _client
