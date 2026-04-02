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
"""
Unit tests for core modules.
"""


def test_db_client_module_importable() -> None:
    """Verify the Firestore client module can be imported."""
    from app.db import client

    assert hasattr(client, "get_firestore_client")


def test_system_prompt_types_defined() -> None:
    """Verify PROMPT_TYPES constant is populated."""
    from app.db.system_prompts import PROMPT_TYPES

    assert "router" in PROMPT_TYPES
    assert "beginner" in PROMPT_TYPES
    assert "freestyle" in PROMPT_TYPES
    assert "summarisation" in PROMPT_TYPES
