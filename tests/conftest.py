"""Shared test fixtures.

When the Firestore emulator is running (FIRESTORE_EMULATOR_HOST is set),
tests use it.  Otherwise, tests that need Firestore are skipped with a
clear message.
"""

from __future__ import annotations

import os

import pytest

# ---------------------------------------------------------------------------
# Emulator guard
# ---------------------------------------------------------------------------

requires_emulator = pytest.mark.skipif(
    not os.environ.get("FIRESTORE_EMULATOR_HOST"),
    reason="FIRESTORE_EMULATOR_HOST not set — start the Firestore emulator first",
)


@pytest.fixture()
def emulator_project() -> str:
    """Return the Firebase project ID used by the emulator."""
    host = os.environ.get("FIRESTORE_EMULATOR_HOST")
    if not host:
        pytest.skip("FIRESTORE_EMULATOR_HOST not set")
    return os.environ.get("GOOGLE_CLOUD_PROJECT", "demo-test")


@pytest.fixture()
def firebase_app():
    """Initialise firebase_admin (call only in tests that need it)."""
    import firebase_admin

    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    return firebase_admin.get_app()
