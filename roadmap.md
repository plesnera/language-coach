# Language Coach — Implementation Roadmap

This document captures the ordered set of tasks required to reach the following goals:

1. **Firestore for all data** — dev mode uses the Firestore emulator instead of an in-memory mock
2. **Firebase Auth via Firestore** — dev mode auto-logs in a `local-test-user`
3. **Seed data written to Firestore** — all starter content seeded through the db layer
4. **Admin content section** — full CRUD for lessons, topics, prompts via the existing admin pages
5. **No hardcoded prompts** — all agent instructions live in Firestore `system_prompts`

---

## Current state summary

| Area | Status |
|---|---|
| Firestore db layer (`app/db/`) | ✅ Complete — all collections have repositories |
| LOCAL_DEV data store | ⚠️ In-memory mock (`memory_store.py`) — not the emulator |
| Backend auth (Firebase Admin) | ✅ Production-ready; LOCAL_DEV bypass works |
| Frontend auth | ⚠️ Firebase SDK wired up but local auto-login flow incomplete |
| Seed data — languages, courses, topics | ✅ `seed_defaults()` runs on startup via Firestore |
| Seed data — system_prompts | ❌ Missing — no seed function exists |
| Admin backend API | ✅ Full CRUD on `/api/admin/*` |
| Admin frontend pages | ⚠️ Pages exist; need audit for completeness |
| Hardcoded agent prompts | ❌ `DEFAULT_INSTRUCTION` strings in every agent file; `router_agent.py` instruction fully hardcoded |

---

## Phase 1 — Firestore Emulator for Local Dev

**Goal:** Replace `memory_store.py` with a real Firestore emulator so local dev is an accurate
replica of production. Data survives process restarts (via emulator export/import).

### 1.1 — Install Firebase tools and configure the emulator

- Add `firebase-tools` to the dev toolchain (or document `npm install -g firebase-tools`)
- Create `firebase.json` at the project root:
  ```json
  {
    "emulators": {
      "firestore": { "port": 8080 },
      "ui": { "enabled": true, "port": 4000 }
    }
  }
  ```
- Create `.firebaserc` pointing at the dev project ID (`playground-anton`)
- Add `emulator-data/` to `.gitignore` (optional persistence directory)

### 1.2 — Update `app/db/client.py` to connect to the emulator

Remove the `LOCAL_DEV → MemoryClient` branch. Instead, let the real Firestore client connect
to the emulator by relying on the `FIRESTORE_EMULATOR_HOST` environment variable that the
Firestore SDK honours automatically:

```python
def get_firestore_client() -> Any:
    global _client
    if _client is None:
        from google.cloud import firestore
        project = os.environ.get("GOOGLE_CLOUD_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
        _client = firestore.Client(project=project)
    return _client
```

No special LOCAL_DEV branch needed — if `FIRESTORE_EMULATOR_HOST=localhost:8080` is set, the
SDK routes all traffic there automatically.

### 1.3 — Update the Makefile

Add an emulator target and update `local-backend` / `playground-dev`:

```makefile
emulator:
    firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

local-backend:
    FIRESTORE_EMULATOR_HOST=localhost:8080 \
    LOCAL_DEV=true \
    uv run python -m app.app_utils.expose_app --mode local \
        --port 8000 --local-agent app.agents.router_agent.root_agent

playground-dev:
    $(MAKE) emulator &
    $(MAKE) local-backend &
    $(MAKE) ui
```

### 1.4 — Remove `memory_store.py`

Once the emulator is the local backend, `app/db/memory_store.py` is no longer needed.
- Delete the file
- Remove the `MemoryClient` import branch from `client.py`
- Update tests that import `memory_store` to use the emulator or a test project

### 1.5 — Verify seed data works against the emulator

Run `make local-backend` and confirm that `seed_defaults()` populates the emulator
(visible in the Emulator UI at `http://localhost:4000`).

---

## Phase 2 — Authentication with Firestore / Firebase Auth

**Goal:** Use Firebase Auth (with the Auth Emulator in dev) end-to-end. Dev mode auto-logs in
a `local-test-user` without going through the login form.

### 2.1 — Add Firebase Auth Emulator to `firebase.json`

```json
{
  "emulators": {
    "auth":      { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui":        { "enabled": true, "port": 4000 }
  }
}
```

### 2.2 — Backend: connect `firebase_admin` to the Auth Emulator in LOCAL_DEV

In `app/auth/dependencies.py` and `app/auth/router.py`, the `_LOCAL_DEV` check currently
bypasses Firebase entirely. Instead, point the SDK at the emulator when the
`FIREBASE_AUTH_EMULATOR_HOST` env var is set:

```python
if not firebase_admin._apps:
    firebase_admin.initialize_app()
# When FIREBASE_AUTH_EMULATOR_HOST is set the SDK routes to the emulator automatically.
```

Update the Makefile:
```makefile
local-backend:
    FIRESTORE_EMULATOR_HOST=localhost:8080 \
    FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
    LOCAL_DEV=true \
    uv run python -m app.app_utils.expose_app ...
```

This means the `LOCAL_DEV` bypass in `auth/dependencies.py` can be removed — real Firebase
Auth tokens are issued by the emulator and verified by `firebase_auth.verify_id_token`.

### 2.3 — Backend: seed a `local-test-user` on startup

Add a function to `app/auth/` (or the lifespan in `expose_app.py`) that creates a
`local-test-user@localhost` account in the Auth Emulator on first startup if it doesn't exist,
and stores the matching document in the Firestore `users` collection:

```python
async def seed_local_test_user():
    if not os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
        return
    try:
        firebase_auth.get_user_by_email("local-test-user@localhost")
    except firebase_auth.UserNotFoundError:
        user = firebase_auth.create_user(
            email="local-test-user@localhost",
            password="devpassword",
            display_name="Local Test User",
        )
        users_repo.create(uid=user.uid, email=user.email,
                          display_name="Local Test User", role="admin")
```

### 2.4 — Frontend: auto-login in dev mode

In `frontend/src/contexts/AuthContext.tsx`:
- Detect `VITE_LOCAL_DEV=true` (or `import.meta.env.DEV`)
- On mount, call `signInWithEmailAndPassword("local-test-user@localhost", "devpassword")`
  against the Auth Emulator (`connectAuthEmulator(auth, "http://localhost:9099")`)
- This produces a real Firebase ID token that the backend verifies — no special bypass needed

In `frontend/src/` (likely `firebase.ts` / auth initialisation):
```typescript
if (import.meta.env.VITE_LOCAL_DEV === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### 2.5 — Remove LOCAL_DEV auth bypass

Once the emulator handles auth end-to-end:
- Remove the `_LOCAL_DEV` checks in `app/auth/dependencies.py` and `app/auth/router.py`
- Remove the `dev-bypass` token logic and `_ensure_dev_user()` helper
- Remove `VITE_LOCAL_DEV` handling that returns a fake user object

### 2.6 — Update environment variable documentation in `AGENT.md`

Replace the `LOCAL_DEV` / `VITE_LOCAL_DEV` bypass description with emulator connection variables.

---

## Phase 3 — Seed Data via Firestore

**Goal:** All starter content — languages, courses, lessons, topics, system prompts — is seeded
into Firestore on first startup, with no hardcoded data staying only in Python constants.

### 3.1 — Add `seed_defaults()` to `app/db/system_prompts.py`

Create a seed function that writes all four agent prompts into the `system_prompts` collection
if none exist yet. The prompt text comes from the current `DEFAULT_INSTRUCTION` constants in the
agent files (moved here):

```python
def seed_defaults() -> None:
    """Seed one active system prompt per agent type for Spanish if none exist."""
    for prompt_type, name, text in _SEED_PROMPTS:
        if get_active("es", prompt_type) is not None:
            continue
        create(
            language_id="es",
            prompt_type=prompt_type,
            name=name,
            prompt_text=text,
            is_active=True,
        )
```

The `_SEED_PROMPTS` list should include entries for:
- `"router"` — the greeting and routing instruction from `router_agent.py`
- `"beginner"` — from `beginner_agent.py::DEFAULT_INSTRUCTION`
- `"topic"` — from `topic_agent.py::DEFAULT_INSTRUCTION`
- `"freestyle"` — from `freestyle_agent.py::DEFAULT_INSTRUCTION`

### 3.2 — Call `system_prompts.seed_defaults()` in the lifespan

In `app/app_utils/expose_app.py`:
```python
from app.db import system_prompts as prompts_repo

async def lifespan(app):
    lang_repo.seed_defaults()
    courses_repo.seed_defaults()
    topics_repo.seed_defaults()
    prompts_repo.seed_defaults()   # ← add this
    yield
```

### 3.3 — Verify seed data in the Admin UI

After startup, navigate to `/admin/prompts` and confirm all four prompts appear with
`is_active = true`. Lesson and topic data should already appear in `/admin/courses` and
`/admin/topics`.

---

## Phase 4 — Admin Content Section

**Goal:** Admins can create, edit, delete, and reorder lessons and topics through the existing
admin pages. All changes persist immediately in Firestore.

### 4.1 — Audit existing admin pages

Read through each file in `frontend/src/pages/admin/` and verify that every admin action calls
the correct backend endpoint and refreshes the UI on success:

| Page | Endpoint | Operations to verify |
|---|---|---|
| `AdminCoursesPage.tsx` | `/api/admin/courses` | Create, edit title/description, delete |
| `AdminLessonsPage.tsx` | `/api/admin/courses/{id}/lessons` | Create, edit all fields, reorder (`/reorder`), delete |
| `AdminTopicsPage.tsx` | `/api/admin/topics` | Create, edit, delete |
| `AdminPromptsPage.tsx` | `/api/admin/prompts` | Create, edit prompt text, activate (`/{id}/activate`), delete |
| `AdminUsersPage.tsx` | `/api/admin/users/` | List, update role, disable/enable |

### 4.2 — Lesson editor — rich fields

`AdminLessonsPage.tsx` must expose all lesson fields:
- `title` — text input
- `objective` — text input
- `teaching_prompt` — multiline textarea (this is per-lesson and different from system prompts)
- `image_url` — image picker connected to `GET /api/admin/images` + `POST /api/admin/images/upload`
- `source_audio_ref` / `source_transcript` — optional; used for audio-based content
- `sort_order` — drag-to-reorder or numeric input, calls `/reorder` on save

### 4.3 — Topic editor

`AdminTopicsPage.tsx` must expose:
- `title`, `description` — text inputs
- `conversation_prompt` — multiline textarea (this drives what the topic agent discusses)
- `image_url` — image picker
- `sort_order` — reorder control

### 4.4 — Prompt editor

`AdminPromptsPage.tsx` must expose:
- `name` — friendly label for the prompt version
- `type` — dropdown: `router` | `beginner` | `topic` | `freestyle`
- `language_id` — dropdown (from `/api/languages/`)
- `prompt_text` — large multiline textarea
- `is_active` — read-only badge; activation is triggered by an "Activate" button
  that calls `POST /api/admin/prompts/{id}/activate`

Multiple versions of a prompt can exist; only one per `(language_id, type)` pair is active at
a time. The editor should show all versions and make it clear which is active.

### 4.5 — Image library

Add a reusable image picker component used by lesson and topic editors:
- Fetches `GET /api/admin/images` and displays thumbnails
- Includes a drag-and-drop upload area that calls `POST /api/admin/images/upload`
- On selection, sets the `image_url` field and shows a preview

### 4.6 — Backend: verify all admin endpoints return complete data

Check `app/api/admin.py` to confirm every endpoint:
- Returns the updated document after create/update (not just `{ "status": "ok" }`)
- Returns a meaningful error body on validation failure (Pydantic already handles this)
- Lesson reorder endpoint accepts `[{ id, sort_order }]` and updates all in one call

---

## Phase 5 — Remove Hardcoded Prompts

**Goal:** Agent behaviour is entirely driven by Firestore. No prompt text lives in Python source
files. Changing an agent's instruction requires only an admin UI change, not a code deploy.

### 5.1 — Add `"router"` to the valid prompt types

In `app/db/system_prompts.py`:
```python
PROMPT_TYPES = ("router", "beginner", "topic", "freestyle", "summarisation")
```

### 5.2 — Update `prompt_loader.py` to load the router prompt

```python
def load_prompt(language_id: str, prompt_type: str, default: str = "") -> str:
    try:
        from app.db import system_prompts as prompts_repo
        active = prompts_repo.get_active(language_id, prompt_type)
        if active is not None:
            return active["prompt_text"]
    except Exception:
        logger.warning("Could not load prompt %s/%s from Firestore", language_id, prompt_type)
    return default
```

Remove the `default` parameter requirement — if Firestore has the prompt, no default is needed.
Keep a minimal fallback only for cases where Firestore is genuinely unreachable (e.g. during CI).

### 5.3 — Update `router_agent.py` to load its instruction from Firestore

```python
from app.agents.prompt_loader import load_prompt

_ROUTER_FALLBACK = (
    "You are the Language Coach routing agent. ..."  # keep as emergency fallback only
)

root_agent = Agent(
    name="root_agent",
    model=Gemini(model="gemini-live-2.5-flash-native-audio", ...),
    instruction=load_prompt("es", "router", _ROUTER_FALLBACK),
    sub_agents=[_beginner, _topic, _freestyle],
)
```

### 5.4 — Remove `DEFAULT_INSTRUCTION` constants from agent files

In `beginner_agent.py`, `topic_agent.py`, `freestyle_agent.py`:
- Move the constant text into `app/db/system_prompts.py::_SEED_PROMPTS` (done in Phase 3.1)
- Change `DEFAULT_INSTRUCTION` to a short emergency fallback (`""` or a one-liner)
- The agent calls `load_prompt(language_id, prompt_type)` and raises clearly if nothing is found

### 5.5 — Remove hardcoded `teaching_prompt` text from `courses.py` seed data

The lesson `teaching_prompt` field in `courses.py::seed_defaults()` contains inline prompt text.
This is per-lesson (not a system prompt), so it should remain in Firestore on the lesson document.
It is already seeded correctly — no action needed beyond ensuring it is editable in the admin UI
(covered in Phase 4.2).

### 5.6 — Add a startup guard for missing required prompts

In `expose_app.py` lifespan, after seeding:
```python
for prompt_type in ("router", "beginner", "topic", "freestyle"):
    if prompts_repo.get_active("es", prompt_type) is None:
        logging.warning(
            "No active system prompt found for type '%s'. "
            "Agent will use fallback text. Visit /admin/prompts to configure.",
            prompt_type,
        )
```

---

## Phase 6 — Test Coverage

**Goal:** A trustworthy test suite that can be run in CI without real GCP credentials, that
catches regressions in every layer, and that specifically pins down the bidirectional audio
streaming behaviour that is currently unreliable.

### Current state of tests

| Layer | Files | Status |
|---|---|---|
| Backend unit | `tests/unit/test_dummy.py`, `test_services.py` | Thin — 3 import checks + service stubs using `memory_store` |
| Backend integration | `tests/integration/test_agent_engine_app.py` | Starts a real server; audio message format does not match what ADK expects; fails without GCP credentials |
| Frontend unit | `multimodal-live-client.test.ts`, `SessionPage.test.tsx`, `LessonSessionPage.test.tsx`, `TopicSessionPage.test.tsx` | Good coverage of the WS client; session pages partially covered |
| E2E (Playwright) | `frontend/tests/app.spec.ts`, `auth.spec.ts` | Brittle — relies on nth-child CSS paths; only smoke-tests page loads |

Known gap: **zero tests** for auth endpoints, all admin REST endpoints, db repositories at
the HTTP layer, and the full WebSocket audio round-trip.

---

### 6.1 — Diagnose and fix the bidirectional audio streaming

Before writing tests, identify and resolve the streaming breakage. The likely causes based on
code inspection:

**Issue A — Message format mismatch between frontend and ADK**

The `expose_app.py` `receive_from_client` method forwards every non-`setup` JSON message
directly into `input_queue`. The ADK `bidi_stream_query` loop then consumes items from that
queue and expects them to be valid `LiveRequest` objects. However:

- The frontend sends `{ blob: { mimeType, data } }` for audio chunks (correct ADK format)
- The frontend sends `{ content: { role: "user", parts: [...] } }` for text (correct)
- The existing integration test sends `{ realtimeInput: { mediaChunks: [...] } }` — a legacy
  format that is NOT what the current `multimodal-live-client.ts` sends

Verify by adding logging in `receive_from_client` to print every item placed into the queue,
then comparing against what ADK actually consumes. Fix any mismatch before writing tests.

**Issue B — Setup message is silently dropped; ADK may need it**

The `setup` key in the first message is logged and skipped (`continue`). Confirm that the ADK
`bidi_stream_query` implementation does not also require a setup/configuration payload.
If it does, pass it through as the first item on the queue.

**Issue C — `setupComplete` timing**

The backend sends `setupComplete` after a hardcoded `asyncio.sleep(1)`. If the frontend sends
audio before the sleep completes, those chunks are queued but the client has not yet received
`setupComplete` and may be in an unexpected state. Test whether removing or reducing the delay
changes behaviour.

**Resolution:** add an explicit `debug_ws.py` script (or temporary logging) to capture a raw
WebSocket exchange and compare the actual bytes sent vs what ADK receives. Document the
confirmed working message sequence in a comment in `expose_app.py`.

---

### 6.2 — Backend unit tests

Create `tests/unit/test_db_repos.py` — test each Firestore repository against the **emulator**
(not the in-memory mock). Set `FIRESTORE_EMULATOR_HOST=localhost:8080` in the test environment
and use a `conftest.py` fixture that clears relevant collections before each test.

Cover:
- `users` — `create`, `get`, `update`, `list_all`
- `languages` — `create`, `get`, `list_enabled`, `seed_defaults` (idempotent)
- `courses` — `create`, `update`, `delete` (cascades lessons), `list_by_language`, `seed_defaults`
- `lessons` (sub-collection) — `create_lesson`, `update_lesson`, `delete_lesson`, `list_lessons`
- `topics` — full CRUD + `seed_defaults`
- `system_prompts` — `create`, `get_active`, `activate` (deactivates siblings), `seed_defaults`
- `conversations` — `create`, `append_message` (ArrayUnion), `list_by_user`
- `progress` — `upsert` creates on first call, updates on second
- `uploaded_documents` — `create`, `list_by_user`, `delete`

Create `tests/unit/test_prompt_loader.py`:
- Returns Firestore value when an active prompt exists
- Returns default when no active prompt exists
- Returns default when Firestore raises an exception

Create `tests/unit/test_websocket_adapter.py` — unit-test `WebSocketToQueueAdapter` in
isolation with a mock WebSocket and a mock agent engine:
- `receive_from_client` puts valid messages on the queue
- `receive_from_client` skips `setup` messages without putting them on the queue
- `receive_from_client` handles malformed JSON without crashing
- `receive_from_client` exits cleanly on `ConnectionClosedError`
- `_transform_remote_agent_engine_response` unwraps `bidiStreamOutput` correctly
- `run_agent_engine` sends `setupComplete` and then forwards agent responses to the WebSocket

---

### 6.3 — Backend REST API integration tests

Create `tests/integration/test_api.py`. Use **pytest + FastAPI `TestClient`** (synchronous,
no subprocess needed) with the Firestore emulator. Seed a minimal dataset in `conftest.py`.

Auth setup for tests: generate a Firebase emulator ID token using the REST API
(`POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`)
and pass it as `Authorization: Bearer <token>` to protected endpoints.

Cover:

**Auth (`/api/auth/`)**
- `POST /register` creates user in Firestore and returns uid + display_name
- `POST /register` returns 409 if email already exists
- `POST /forgot-password` returns 200 regardless of whether email exists

**Languages (`/api/languages/`)**
- `GET /` returns only enabled languages

**Courses + Lessons (`/api/courses/`)**
- `GET /?language_id=es` returns seeded courses
- `GET /{id}/lessons` returns lessons in `sort_order`
- `GET /{id}/lessons/{lesson_id}` returns full lesson detail

**Topics (`/api/topics/`)**
- `GET /?language_id=es` returns seeded topics

**Progress (`/api/progress/`)**
- `POST /` creates/updates progress record
- `GET /` returns progress for the authenticated user only

**Conversations (`/api/conversations/`)**
- `POST /` creates conversation linked to user
- `GET /` returns only the authenticated user's conversations

**Admin (`/api/admin/`)**
- Full CRUD cycle for courses, lessons, topics, system_prompts
- `POST /prompts/{id}/activate` deactivates sibling and activates target
- `GET/PUT /users/` list and role update
- Non-admin token receives 403 on all `/api/admin/*` routes

---

### 6.4 — WebSocket / audio streaming integration test

Replace the existing `test_agent_engine_app.py` with a proper test that uses the **correct
message format** and tests against a mock ADK engine rather than a live Vertex AI connection.

Key changes vs. the existing test:

```python
# conftest.py — patch the ADK agent engine with a controllable fake
@pytest.fixture
def fake_agent_engine():
    """Returns pre-defined responses to simulate the ADK bidi_stream_query."""
    class FakeAgentEngine:
        async def bidi_stream_query(self, input_queue):
            # Drain one item then yield a text response
            await input_queue.get()
            yield {"serverContent": {"modelTurn": {"parts": [{"text": "¡Hola!"}]}}}
            yield {"serverContent": {"turnComplete": True}}
    return FakeAgentEngine()
```

Tests to write:

- **Handshake**: client connects → server sends `setupComplete` → client sends setup message
  → setup message is logged but NOT forwarded to the queue
- **Text round-trip**: client sends `{ content: { role: "user", parts: [{ text: "Hola" }] } }`
  → queue receives the message → fake engine yields a response → client receives it
- **Audio chunk round-trip**: client sends `{ blob: { mimeType: "audio/pcm;rate=16000", data: "<b64>" } }`
  → queue receives the message → engine processes it → audio response is forwarded back
- **Interruption**: engine yields `{ serverContent: { interrupted: true } }` → client
  receives the interruption event
- **Connection cleanup**: WebSocket closes mid-stream → `receive_from_client` exits cleanly
  without leaving orphan tasks
- **Backoff retry**: `ConnectionClosedError` triggers the backoff decorator and the status
  message `"Model connection error, retrying..."` is sent to the client

---

### 6.5 — Frontend unit tests

**`AuthContext.test.tsx`**
- In dev mode (`VITE_LOCAL_DEV=true`), the context calls `signInWithEmailAndPassword`
  automatically on mount
- In production mode, no auto-login occurs; user starts as `null`
- `logout()` calls `signOut` and clears the user

**`AdminCoursesPage.test.tsx`**
- Renders list of courses fetched from the API
- "New Course" button opens a creation form; submitting calls `POST /api/admin/courses`
- "Delete" button calls `DELETE /api/admin/courses/{id}` and removes the row

**`AdminLessonsPage.test.tsx`**
- Renders lessons for a given course
- Edit form pre-populates all fields including `teaching_prompt`
- Saving calls `PUT /api/admin/courses/{id}/lessons/{lesson_id}`

**`AdminPromptsPage.test.tsx`**
- "Activate" button calls `POST /api/admin/prompts/{id}/activate`
- Active prompt is visually distinguished from inactive versions

**`FreestyleSessionPage.test.tsx` and `TopicSessionPage.test.tsx`**
- Each fetches its context data (topic/lesson) and passes a system context to the agent
- Correct API endpoints called with the auth token

---

### 6.6 — E2E tests (Playwright)

Replace brittle `nth-child` selectors with `data-testid` attributes.

Add `data-testid` props to key elements:
```tsx
<button data-testid="start-lesson-btn">Start</button>
<h2 data-testid="course-title">Spanish for Beginners</h2>
```

Rewrite `app.spec.ts`:
```typescript
test('learn page shows seeded course', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByTestId('course-title')).toContainText('Spanish for Beginners');
});
```

Add new E2E tests:
- **Auth flow**: visit `/learn` unauthenticated → redirected to `/login` → submit credentials
  → redirected back to `/learn`
- **Start lesson session**: navigate to a lesson → click Start → session page loads and
  WebSocket connects (`setupComplete` received within 5 s)
- **Admin create topic**: admin logs in → navigates to `/admin/topics` → creates a new topic
  → topic appears in the learner-facing `/topics` page
- **Prompt activation**: admin activates a new system prompt → a fresh session uses that prompt
  (verify by checking the agent's greeting text changes)

---

### 6.7 — CI configuration

Update `.cloudbuild/pr_checks.yaml` (or equivalent) to:
1. Start the Firestore + Auth Emulators before running backend tests:
   ```yaml
   - name: node:20
     entrypoint: npx
     args: [firebase-tools, emulators:start, --only, firestore,auth, --project, demo-test]
     waitFor: ['-']
   ```
2. Set `FIRESTORE_EMULATOR_HOST=localhost:8080` and `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
   in the test step environment
3. Run `uv run pytest tests/unit tests/integration` (not load tests)
4. Run `cd frontend && npx vitest run` for frontend unit tests
5. Run `npx playwright test` for E2E tests against a locally started backend

Use Firebase project ID `demo-test` (the `demo-` prefix is recognised by the emulator and
requires no real project to exist).

---

### 6.8 — Test hygiene

- Remove `tests/unit/test_dummy.py` once `test_db_repos.py` covers the same ground
- Remove `os.environ.setdefault("LOCAL_DEV", "true")` from `test_services.py` — tests should
  run against the emulator, not the in-memory mock
- Add `pytest-asyncio` to `pyproject.toml` dev dependencies (already needed for the WS test)
- Add `conftest.py` at `tests/` root with an `emulator_project` fixture that provides the
  Firebase project ID and verifies `FIRESTORE_EMULATOR_HOST` is set before running any test
  that touches Firestore, producing a clear error message if the emulator is not running

---

## Dependency order

```
Phase 1 (emulator) → Phase 2 (auth emulator) → Phase 3 (seed) → Phase 5 (remove hardcoded)
                   ↘                                           ↘ Phase 4 (admin UI)
                    Phase 6 (tests) ────────────────────────────────────────────────────→
```

Phase 6 depends on Phase 1 (emulator replaces memory store) and Phase 2 (auth emulator
provides real tokens). Individual test suites within Phase 6 can be written in parallel with
Phases 3–5; the streaming diagnosis (6.1) should happen early as it may unblock other work.

---

## Definition of done

- [ ] `make playground-dev` starts the Firestore + Auth Emulators and the dev server with no manual steps
- [ ] Opening `http://localhost:8501` in a browser auto-logs in as `local-test-user` without a login form
- [ ] Emulator UI (`http://localhost:4000`) shows all seeded collections after first startup
- [ ] All four system prompt types appear in `/admin/prompts` with `is_active = true`
- [ ] Creating/editing/deleting a lesson or topic in `/admin/*` is reflected immediately in the learner UI
- [ ] No `DEFAULT_INSTRUCTION` string in any agent file contributes to live agent behaviour
- [ ] `grep -r "DEFAULT_INSTRUCTION" app/agents/` returns no results (or only one-liner emergency fallbacks)
- [ ] `memory_store.py` is deleted from the repository
- [ ] `make test` passes in CI with only the Firestore + Auth Emulators running (no real GCP credentials)
- [ ] A real voice session can be started locally, audio is sent, and the agent responds with audio (verified manually via the debug page)
- [ ] All Playwright tests use `data-testid` selectors — no `nth-child` paths remain
- [ ] `pytest --tb=short tests/` produces zero failures and zero warnings about skipped emulator tests
