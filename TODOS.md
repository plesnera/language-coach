# TODOS

## Batch Firestore writes in reorder_lessons

**What:** Refactor `reorder_lessons` in `app/api/admin.py` to use `db.batch()` instead of N sequential `update_lesson` calls.

**Why:** Current implementation does 1 Firestore write per lesson sequentially (N round-trips). For 10 lessons ≈ 1s latency. Firestore WriteBatch handles all N writes in a single request.

**Pros:** Better latency for admin reorder UX; follows Firestore best practices for multi-document updates.

**Cons:** Requires plumbing the Firestore client to the API layer (currently hidden behind repo functions), or adding a `batch_update` helper to `courses_repo`.

**Context:** Not a blocker now — admin-only operation, typically 5-20 lessons. Becomes noticeable if courses have 20+ lessons or on slow connections. The pattern is already established in the codebase (Firestore client exposed via `get_firestore_client()`).

**Where to start:** `app/api/admin.py:130` (`reorder_lessons`), `app/db/courses.py` (add `batch_update_lessons`).

**Depends on / blocked by:** Nothing.

---

## Auth middleware test coverage

**What:** Add tests that verify the Firebase token verification middleware (`app/auth/dependencies.py`) directly — currently all integration tests use `dependency_overrides` which bypass `get_current_user` entirely.

**Why:** A regression in the middleware (wrong token field checked, wrong 401 vs 403 status code, missing `disabled` user check) would not be caught by any current test.

**Pros:** Closes the last meaningful auth coverage gap. Verifies the actual Firebase ID token verification path.

**Cons:** Requires the Firebase Auth Emulator REST API to generate real ID tokens (`POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`). Additional emulator setup and fixture complexity.

**Context:** The original design doc (2026-03-26) planned real Auth Emulator tokens via a `conftest.py` fixture. This was simplified to `dependency_overrides` to reduce scope. This TODO tracks completing the original intent.

**Where to start:** `tests/conftest.py` — add `auth_token` fixture that calls the Auth Emulator REST API to sign in and return a real Bearer token. Update `app/auth/dependencies.py` tests.

**Depends on / blocked by:** Firebase Auth Emulator must be running alongside Firestore Emulator (already in `firebase.json`).
