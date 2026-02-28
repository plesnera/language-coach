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

"""Load system prompts from Firestore with a hardcoded fallback."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def load_prompt(language_id: str, prompt_type: str, default: str) -> str:
    """Return the active prompt for *language_id* / *prompt_type*.

    Falls back to *default* if Firestore is unreachable or no active
    prompt has been configured yet.
    """
    try:
        from app.db import system_prompts as prompts_repo

        active = prompts_repo.get_active(language_id, prompt_type)
        if active is not None:
            return active["prompt_text"]
    except Exception:
        logger.warning(
            "Could not load prompt from Firestore for %s/%s — using default",
            language_id,
            prompt_type,
            exc_info=True,
        )
    return default
