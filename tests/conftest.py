"""Shared test fixtures.

When the Firestore emulator is running (FIRESTORE_EMULATOR_HOST is set),
tests use it.  Otherwise, tests that need Firestore are skipped with a
clear message.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import Callable

import pytest
import requests

# ---------------------------------------------------------------------------
# Emulator guard
# ---------------------------------------------------------------------------


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Skip tests marked requires_emulator when the emulator is not running."""
    if os.environ.get("FIRESTORE_EMULATOR_HOST"):
        return
    skip = pytest.mark.skip(
        reason="FIRESTORE_EMULATOR_HOST not set — start the Firestore emulator first"
    )
    for item in items:
        if item.get_closest_marker("requires_emulator"):
            item.add_marker(skip)


@pytest.fixture()
def emulator_project() -> str:
    """Return the Firebase project ID used by the emulator."""
    host = os.environ.get("FIRESTORE_EMULATOR_HOST")
    if not host:
        raise RuntimeError("FIRESTORE_EMULATOR_HOST not set")
    return os.environ.get("GOOGLE_CLOUD_PROJECT", "demo-test")


@pytest.fixture()
def firebase_app():
    """Initialise firebase_admin (call only in tests that need it)."""
    import firebase_admin

    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    return firebase_admin.get_app()


@pytest.fixture()
def auth_token_factory(
    emulator_project: str, firebase_app
) -> Callable[..., tuple[str, str]]:
    """Return a factory that creates Auth Emulator users and yields (token, uid)."""
    from firebase_admin import auth as firebase_auth

    from app.db import users as users_repo
    from app.db.client import get_firestore_client

    auth_host = os.environ.get("FIREBASE_AUTH_EMULATOR_HOST")
    if not auth_host:
        raise RuntimeError("FIREBASE_AUTH_EMULATOR_HOST not set")

    created_uids: list[str] = []

    def _create(
        *,
        role: str = "admin",
        disabled: bool = False,
        create_firestore_user: bool = True,
    ) -> tuple[str, str]:
        email = f"auth-test-{uuid.uuid4().hex[:10]}@test.local"
        password = "testpassword123"
        resp = requests.post(
            f"http://{auth_host}/identitytoolkit.googleapis.com/v1/accounts:signUp"
            "?key=fake-api-key",
            json={"email": email, "password": password, "returnSecureToken": True},
            timeout=10,
        )
        resp.raise_for_status()
        payload = resp.json()
        uid = payload["localId"]
        token = payload["idToken"]
        created_uids.append(uid)

        if create_firestore_user:
            users_repo.create(
                uid=uid,
                email=email,
                display_name="Auth Test User",
                role=role,
            )
            if disabled:
                users_repo.update(uid, {"disabled": True})

        return token, uid

    yield _create

    db = get_firestore_client()
    users_collection = db.collection(users_repo.COLLECTION)
    for uid in created_uids:
        try:
            users_collection.document(uid).delete()
        except Exception:
            pass
        try:
            firebase_auth.delete_user(uid)
        except Exception:
            pass


@pytest.fixture()
def auth_token(
    auth_token_factory: Callable[..., tuple[str, str]],
) -> str:
    """Create a valid admin bearer token backed by emulator auth + Firestore user."""
    token, _ = auth_token_factory(role="admin")
    return token
