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

"""Public language endpoints (``/api/languages/``)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db import languages as lang_repo
from app.services import cache

router = APIRouter(prefix="/api/languages", tags=["languages"])


@router.get("/")
def list_languages(
    _user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return all enabled languages."""
    cache_key = "languages:enabled"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = lang_repo.list_enabled()
    cache.set(cache_key, result, ttl=300)
    return result
