"""In-memory Firestore-compatible store for local development.

Implements the subset of the Firestore client API used by the repository
modules so that the application can run without any GCP connectivity.

Data is ephemeral — it lives only for the lifetime of the process.
"""

from __future__ import annotations

import copy
import uuid
from typing import Any

# ---------------------------------------------------------------------------
# Sentinel used by .update() to append to array fields (mirrors ArrayUnion)
# ---------------------------------------------------------------------------

class _ArrayUnionValue:
    """Matches the role of ``google.cloud.firestore_v1.ArrayUnion``."""

    def __init__(self, values: list[Any]) -> None:
        self.values = values


# Re-export so callers that do ``from google.cloud.firestore_v1 import ArrayUnion``
# can be patched to use this instead without code changes.  In practice the
# repos import ArrayUnion only in ``conversations.py``; the memory_store
# handles it by duck-type checking in ``MemoryDocRef.update()``.


# ---------------------------------------------------------------------------
# Global store: flat dict keyed by full path  ("collection/docId")
# ---------------------------------------------------------------------------

_store: dict[str, dict[str, Any]] = {}


def _reset() -> None:
    """Clear the entire in-memory store (useful for tests)."""
    _store.clear()


# ---------------------------------------------------------------------------
# MemorySnapshot
# ---------------------------------------------------------------------------

class MemorySnapshot:
    """Minimal duck-type replacement for ``DocumentSnapshot``."""

    def __init__(
        self, doc_id: str, data: dict[str, Any] | None, reference: MemoryDocRef
    ) -> None:
        self._id = doc_id
        self._data = data
        self._reference = reference

    @property
    def id(self) -> str:
        return self._id

    @property
    def exists(self) -> bool:
        return self._data is not None

    @property
    def reference(self) -> MemoryDocRef:
        return self._reference

    def to_dict(self) -> dict[str, Any] | None:
        if self._data is None:
            return None
        return copy.deepcopy(self._data)


# ---------------------------------------------------------------------------
# MemoryDocRef
# ---------------------------------------------------------------------------

class MemoryDocRef:
    """Minimal duck-type replacement for ``DocumentReference``."""

    def __init__(self, path: str, doc_id: str) -> None:
        self._path = path          # e.g. "courses"
        self._doc_id = doc_id
        self._full_path = f"{path}/{doc_id}"

    @property
    def id(self) -> str:
        return self._doc_id

    # -- CRUD ---------------------------------------------------------------

    def get(self) -> MemorySnapshot:
        data = _store.get(self._full_path)
        return MemorySnapshot(self._doc_id, data, reference=self)

    def set(self, data: dict[str, Any]) -> None:
        _store[self._full_path] = copy.deepcopy(data)

    def update(self, fields: dict[str, Any]) -> None:
        existing = _store.get(self._full_path)
        if existing is None:
            raise ValueError(f"Document {self._full_path} does not exist")
        for key, value in fields.items():
            # Handle ArrayUnion (from google.cloud.firestore_v1 or our own)
            if hasattr(value, "values"):
                current = existing.get(key, [])
                if not isinstance(current, list):
                    current = []
                existing[key] = current + list(value.values)
            else:
                existing[key] = copy.deepcopy(value)

    def delete(self) -> None:
        _store.pop(self._full_path, None)

    # -- Sub-collections ----------------------------------------------------

    def collection(self, name: str) -> MemoryCollectionRef:
        return MemoryCollectionRef(f"{self._full_path}/{name}")


# ---------------------------------------------------------------------------
# MemoryQuery
# ---------------------------------------------------------------------------

class MemoryQuery:
    """Chainable query builder that filters/sorts the in-memory store."""

    def __init__(self, collection_path: str) -> None:
        self._collection_path = collection_path
        self._filters: list[tuple[str, str, Any]] = []
        self._order_fields: list[tuple[str, str]] = []
        self._offset_val: int = 0
        self._limit_val: int | None = None

    # -- Chain methods ------------------------------------------------------

    def where(self, field: str, op: str, value: Any) -> MemoryQuery:
        clone = self._clone()
        clone._filters.append((field, op, value))
        return clone

    def order_by(self, field: str, direction: str = "ASCENDING") -> MemoryQuery:
        clone = self._clone()
        clone._order_fields.append((field, direction))
        return clone

    def offset(self, n: int) -> MemoryQuery:
        clone = self._clone()
        clone._offset_val = n
        return clone

    def limit(self, n: int) -> MemoryQuery:
        clone = self._clone()
        clone._limit_val = n
        return clone

    # -- Execute ------------------------------------------------------------

    def stream(self):
        prefix = self._collection_path + "/"
        results: list[tuple[str, dict[str, Any]]] = []
        for full_path, data in _store.items():
            if not full_path.startswith(prefix):
                continue
            # Only direct children (no deeper subcollections)
            remainder = full_path[len(prefix):]
            if "/" in remainder:
                continue
            doc_id = remainder
            if self._matches(data):
                results.append((doc_id, data))

        # Sort
        for field, direction in reversed(self._order_fields):
            reverse = direction.upper() == "DESCENDING"
            results.sort(
                key=lambda pair: (
                    pair[1].get(field)
                    if pair[1].get(field) is not None
                    else ""
                ),
                reverse=reverse,
            )

        # Offset / limit
        results = results[self._offset_val:]
        if self._limit_val is not None:
            results = results[: self._limit_val]

        for doc_id, data in results:
            ref = MemoryDocRef(self._collection_path, doc_id)
            yield MemorySnapshot(doc_id, data, reference=ref)

    # -- Internals ----------------------------------------------------------

    def _matches(self, data: dict[str, Any]) -> bool:
        for field, op, value in self._filters:
            actual = data.get(field)
            if op == "==":
                if actual != value:
                    return False
            elif op == "!=":
                if actual == value:
                    return False
            elif op == "<":
                if actual is None or actual >= value:
                    return False
            elif op == "<=":
                if actual is None or actual > value:
                    return False
            elif op == ">":
                if actual is None or actual <= value:
                    return False
            elif op == ">=":
                if actual is None or actual < value:
                    return False
        return True

    def _clone(self) -> MemoryQuery:
        q = MemoryQuery(self._collection_path)
        q._filters = list(self._filters)
        q._order_fields = list(self._order_fields)
        q._offset_val = self._offset_val
        q._limit_val = self._limit_val
        return q


# ---------------------------------------------------------------------------
# MemoryCollectionRef
# ---------------------------------------------------------------------------

class MemoryCollectionRef(MemoryQuery):
    """Extends ``MemoryQuery`` with ``document()`` creation."""

    def __init__(self, path: str) -> None:
        super().__init__(path)
        self._path = path

    def document(self, doc_id: str | None = None) -> MemoryDocRef:
        if doc_id is None:
            doc_id = uuid.uuid4().hex[:20]
        return MemoryDocRef(self._path, doc_id)


# ---------------------------------------------------------------------------
# MemoryClient
# ---------------------------------------------------------------------------

class MemoryClient:
    """Top-level object returned by ``get_firestore_client()`` in local mode."""

    def collection(self, name: str) -> MemoryCollectionRef:
        return MemoryCollectionRef(name)
