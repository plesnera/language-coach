# Repository guidance for coding agents

## Project overview

Language Coach is a real-time, voice-based language-learning application. Users
practice speaking a target language (currently Spanish) with an AI coach through
three modes: structured beginner lessons, topic-based conversations, and
free-form chat. The backend provides authenticated REST APIs and live AI
sessions; the React frontend provides learner, guest, and admin experiences.

## Technology

- Backend: Python 3.10-3.13, FastAPI, Pydantic v2, Google ADK, Vertex AI
- AI model: `gemini-live-2.5-flash-native-audio` via Vertex AI
- Batch transcription: `voxtral-mini-latest` via Mistral AI
- Data and auth: Google Cloud Firestore and Firebase Auth; local work uses the
  Firebase emulators
- Frontend: React 18, TypeScript, Vite 6, Tailwind CSS 4, SCSS, React Router 7
- Tooling: `uv` for Python and `npm` for the frontend
- Infrastructure: GCP, Terraform, Cloud Build, Cloud Run, Agent Engine, and
  Firebase Hosting

## Repository map

### Backend (`app/`)

- `app/agent.py` — top-level ADK agent entry point (re-exports `root_agent`)
- `app/agent_engine_app.py` — Agent Engine wrapper used for deployment
- `app/api/`: FastAPI routers and request validation
  - `admin.py` (`/api/admin/*`) — admin-only CRUD, protected at router level by `Depends(require_admin)`
  - `conversations.py` (`/api/conversations`)
  - `courses.py` (`/api/courses`)
  - `documents.py` (`/api/documents`)
  - `health.py` (`/api/health`)
  - `languages.py` (`/api/languages`)
  - `progress.py` (`/api/progress`)
  - `topics.py` (`/api/topics`)
- `app/auth/`: Firebase authentication and authorization dependencies
  - `dependencies.py` — `get_current_user`, `require_admin`
  - `router.py` — `/api/auth/register`, `/api/auth/forgot-password`
- `app/db/`: thin Firestore repository functions, one module per collection
  - `client.py` — Firestore client factory; routes to emulator automatically when `FIRESTORE_EMULATOR_HOST` is set
- `app/agents/`: ADK router and teaching agents
  - `router_agent.py` — root agent (routes to sub-agents by mode)
  - `beginner_agent.py`, `topic_agent.py`, `freestyle_agent.py` — sub-agents
  - `prompt_loader.py` — loads system prompts from Firestore
  - `safe_gemini.py` — Gemini wrapper with HTTP retry
  - `setup.py` — Vertex AI / env bootstrap (imported first)
- `app/services/`: document, audio, summarization, and lesson/topic AI services
  - `audio_transcription.py`, `batch_audio_transcription.py` (in `app_utils/`)
  - `document_processing.py`, `summarisation.py`
  - `lesson_builder_ai.py`, `topic_builder_ai.py`
- `app/app_utils/`: application startup, local seeding, deployment helpers,
  security, telemetry, and the FastAPI/WebSocket app (`expose_app.py`)

### Frontend (`frontend/`)

- `frontend/src/`: the active React application
  - `App.tsx` — route definitions, auth guards
  - `firebase.ts` — Firebase SDK initialisation
  - `config/endpoints.ts` — `API_BASE` and `WS_BASE_URL` configuration
  - `contexts/AuthContext.tsx`, `contexts/LiveAPIContext.tsx`
  - `hooks/`, `shared/`, `styles/`, `utils/`
  - `pages/` — `LandingPage`, `LearnPage`, `LessonSessionPage`, `TopicPage`,
    `TopicSessionPage`, `FreestylePage`, `FreestyleSessionPage`,
    `GuestIntroSessionPage`, `IntroFlowPage`, `HistoryPage`, `LoginPage`,
    `SignupPage`, `ForgotPasswordPage`, `RootPage`, `StaticPages`,
    `NotFoundPage`, `DebugPage`, and `pages/admin/`
  - `components/` — hand-drawn UI primitives (`HandDrawnButton`,
    `HandDrawnCard`, `HandDrawnInput`, `DoodleDecorations`, `AppNavbar`,
    `AdminLayout`, `ErrorBoundary`) plus `audio-controller`, `audio-pulse`,
    `logger`, `session`, `side-panel`, `transcription-preview` subsystems
- `frontend/tests/`: Playwright end-to-end and accessibility tests
- `frontend/src_with_new_frontend/` is a separate prototype. Do not modify it
  when working on the active frontend unless the task explicitly targets it.

### Other

- `tests/unit/`: backend tests that do not require emulators
- `tests/integration/`: backend tests that require Firebase emulators
- `tests/load_test/`: load tests run as part of the staging deploy pipeline
- `deployment/`: Terraform and deployment documentation
- `.cloudbuild/`: CI/CD pipeline definitions (`pr_checks.yaml`, `staging.yaml`,
  `deploy-to-prod.yaml`)

## Sources of truth

- Read `README.md` for setup, environment variables, and deployment context.
- Follow `DESIGN.md` for all UI and UX work. Its accessibility and guest-first
  requirements are release gates.
- Use `docs/TESTING.md` for the full testing matrix and `docs/LOCAL_SETUP.md`
  for local environment details.
- `docs/DEPLOYMENT.md` covers the production deploy pipeline.
- If anything here conflicts with current code, manifests, or
  configuration, prefer the current code.

## Common commands

```bash
make install             # install Python and frontend dependencies
make emulator            # Firestore :8080, Auth :9099, UI :4000
make local-backend       # backend with local emulators on :8000
make playground          # build frontend + run backend on :8000
make ui                  # Vite frontend on :8501
make playground-dev      # emulators, backend, and frontend (hot-reload)
make test                # backend unit and integration suites
make lint                # codespell, Ruff, formatting check, and ty
make configure           # interactive check of GCP project + required resources
```

Useful focused checks:

```bash
uv run pytest tests/unit
uv run pytest tests/unit/test_services.py
uv run ruff check <changed-python-paths>
uv run ruff format --check <changed-python-paths>
cd frontend && npm run build
cd frontend && npm run test -- --run
cd frontend && npx playwright test <test-file>
```

Integration tests need the emulators and normally these variables:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
GOOGLE_CLOUD_PROJECT=demo-test \
uv run pytest tests/integration
```

Run the smallest relevant checks while iterating, then broaden verification in
proportion to the change. Do not claim emulator, browser, cloud, or external AI
coverage unless those dependencies were actually available.

## Implementation conventions

### Backend

- Keep request parsing and validation in `app/api/`; keep `app/db/` repositories
  focused on Firestore reads and writes. Repos are thin: they raise nothing and
  return plain dictionaries with the document `id` injected.
- Protect learner endpoints with `get_current_user` and admin endpoints with
  `require_admin`. Do not weaken authentication to make a test pass.
- Preserve `updated_at` behavior on mutations and use Firestore batch writes
  (`db.batch()`, max 500 ops) when a multi-document update must be atomic.
- Use Pydantic v2 APIs such as `model_dump()`.
- Follow the existing `from __future__ import annotations` convention in Python
  modules.
- Add or update tests for changed behavior. Auth-specific integration tests
  should use real emulator tokens via the `auth_token` / `auth_token_factory`
  fixtures in `tests/conftest.py`. Broader API integration tests use the
  `seeded_client` fixture in `tests/integration/test_api.py` with
  `dependency_overrides` to bypass auth.

### Frontend

- Use the shared hand-drawn components and existing page/component patterns
  before creating new primitives.
- Route backend and WebSocket URLs through `frontend/src/config/endpoints.ts`
  (`API_BASE`, `WS_BASE_URL`); do not introduce one-off environment handling
  in pages.
- Check `response.ok` for fallible API calls, surface an inline accessible error
  (`<p className="text-[#DC2626]">`), and roll back failed optimistic updates.
- Do not use browser `alert()` or `confirm()` for product flows. Delete
  confirmations use `HandDrawnCard rotate="left"` modals.
- Preserve semantic HTML, visible focus, keyboard operation, accessible names,
  programmatic form errors, WCAG 2.2 AA contrast, and reduced-motion support.
- Keep the guest-first path intact: users must receive meaningful value before
  signup is required.

### AI and live-session code

- Agent definitions and routing live in `app/agents/`; system prompts are loaded
  from the `system_prompts` Firestore collection rather than duplicated in
  source. The router agent delegates to sub-agents based on user-selected mode.
- The ADK live model is `gemini-live-2.5-flash-native-audio`.
- Treat live audio, WebSocket lifecycle, cancellation, and reconnect changes as
  high-risk. Verify cleanup and failure paths as well as the happy path.
- Never commit credentials, tokens, private prompts, user recordings, or other
  sensitive data. Keep cloud-dependent behavior configurable for local tests.

## Architecture

### Auth flow

```
Request → HTTPBearer → get_current_user()
  ├── No token → 401
  ├── firebase_auth.verify_id_token(token)
  │     └── failure (any exception) → 401
  └── _require_user(uid)
        ├── No Firestore user doc → 401 "User record not found"
        ├── user["disabled"] == True → 403
        └── return user dict
             └── require_admin(user)
                   ├── role != "admin" → 403
                   └── return user
```

- All admin endpoints are under `/api/admin/` and use `Depends(require_admin)`
  at the router level.
- Public learner endpoints are under `/api/` and use `Depends(get_current_user)`.
- Production uses `verify_id_token()`; the Auth Emulator is used locally and is
  reached automatically when `FIREBASE_AUTH_EMULATOR_HOST` is set.

### Database (Firestore)

Repository pattern — `app/db/*.py` functions return plain `dict`s with `id`
included. `get_firestore_client()` in `app/db/client.py` is a module-level
singleton; when `FIRESTORE_EMULATOR_HOST` is set the SDK talks to the emulator
without any branching.

```
collections:
  languages/           {id, name, enabled}
  courses/             {language_id, title, description, sort_order, ...}
    lessons/           {title, objective, teaching_prompt, sort_order,
                        image_url, source_audio_ref, source_transcript, ...}
  topics/              {language_id, title, description, conversation_prompt,
                        sort_order, ...}
  users/               {uid, email, role, disabled, display_name}
  system_prompts/      {language_id, type, name, prompt_text, is_active}
  conversations/       {user_id, language_id, mode, messages[], created_at}
  progress/            {user_id, lesson_id, ...}
  lesson_images/       {filename, url, original_name, created_at}
  uploaded_documents/  {user_id, filename, gcs_path, extracted_text}
```

### Frontend design system

Hand-drawn aesthetic. Shared components in `frontend/src/components/`:
- `HandDrawnButton` — `primary` / `outline` variants
- `HandDrawnCard` — accepts `rotate="none" | "left" | "right"`; use
  `border-[#DC2626]` for destructive cards
- `HandDrawnInput` — text input and `multiline` textarea variant
- `DoodleDecorations` — `SquigglyLine` and other decorative SVGs

Palette:
- Background: `#FAFAF8`
- Ink/text: `#1A1A1A`
- Red/destructive: `#DC2626`
- Amber/AI: `#F59E0B`

Fonts: Lora (headings, `font-heading`), Inter (body). CSS classes:
`hand-drawn-border`, `hand-drawn-border-alt`, `hand-drawn-border-pill`. Loading
spinners use `<Loader2 className="animate-spin">` from lucide-react.

### Design policy (mandatory)

- `DESIGN.md` is the product design source of truth and must be followed for
  new UI and UX changes.
- Accessibility is a release gate: all critical flows must be keyboard operable,
  screen-reader understandable, and meet WCAG 2.2 AA expectations (contrast,
  focus visibility, semantics, labels, and error messaging).
- New users must be able to try a meaningful part of the app before signup.
- Signup should be introduced during the intro flow after a value moment, with
  explicit benefits: personalized curriculum, tracking improvement over time,
  chatting about topics based on user-uploaded content.
- Auth gating must be progressive: at least one useful guest experience is
  available before requiring account creation.

## API endpoints reference

### Public (require auth token)
- `GET /api/languages/`
- `GET /api/courses/?language_id=X`
- `GET /api/courses/{id}/lessons`
- `GET /api/courses/{id}/lessons/{lesson_id}`
- `GET /api/topics/?language_id=X`
- `GET /api/topics/{topic_id}`
- `GET /api/progress/`
- `PUT /api/progress/`
- `GET /api/conversations/`
- `GET /api/conversations/{conversation_id}`
- `GET /api/documents/`
- `POST /api/documents/upload`
- `GET /api/health`
- `POST /feedback`

### Auth
- `POST /api/auth/register` — `{ email, password, display_name }`
- `POST /api/auth/forgot-password` — `{ email }`

### Admin (require admin role, all under `/api/admin/`)
- `CRUD /api/admin/languages`
- `CRUD /api/admin/courses` — `?language_id=X` for listing
- `CRUD /api/admin/courses/{id}/lessons` — includes `/reorder`
- `POST /api/admin/lessons/ai/draft`, `POST /api/admin/lessons/ai/refine`
- `CRUD /api/admin/topics`
- `POST /api/admin/topics/ai/draft`, `POST /api/admin/topics/ai/refine`
- `CRUD /api/admin/prompts` — includes `/{id}/activate`
- `GET/PUT /api/admin/users/` — list, update role, disable
- `GET /api/admin/images`, `POST /api/admin/images/upload`
- `POST /api/admin/transcribe`, `POST /api/admin/transcribe/batch` (Mistral AI)
- `POST /api/admin/summarise` (AI transcript summarisation)

### WebSocket
- `ws://host/ws` — ADK live bidirectional audio session

## Environment variables

- `FIRESTORE_EMULATOR_HOST=localhost:8080` — routes Firestore SDK to the emulator
- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` — routes Firebase Auth SDK to the emulator
- `LOCAL_DEV=true` — service stubs return mock values when GCP APIs are unavailable
- `VITE_LOCAL_DEV=true` — frontend connects to Auth Emulator and auto-logs in
- `VITE_API_BASE_URL` — frontend API base URL (else derived from dev port or relative)
- `VITE_WS_BASE_URL` — frontend WebSocket base URL
- `VITE_FIREBASE_*` — Firebase web config (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, …)
- `GOOGLE_CLOUD_PROJECT` — GCP project ID
- `GOOGLE_CLOUD_LOCATION` — defaults to `europe-west1`
- `GOOGLE_GENAI_USE_VERTEXAI=True` — required for ADK
- `LOGS_BUCKET_NAME`, `IMAGES_BUCKET_NAME` — GCS buckets (optional, used in deploy)

## Seed data

On startup (`expose_app.py`), the backend automatically seeds (idempotent):
- Languages: Spanish (`es`)
- Courses: "Spanish for Beginners" with 4 lessons (Greetings, Numbers, Restaurant, Directions)
- Topics: 3 default conversation topics (Vacation, Family, Jobs)
- System prompts: one active prompt per agent type (`router`, `beginner`, `topic`, `freestyle`)
- Auth Emulator user: `local-test-user@localhost` (admin) when running against the emulator

Seed functions live in each db module's `seed_defaults()` method and are
called from the FastAPI `lifespan` handler. Startup fails if any required
active system prompt is missing.

## Deployment

Production lives at `https://language-coach.web.app` (Firebase Hosting), with
the FastAPI backend on Cloud Run (`language-coach-api`) and the ADK agent on
Vertex Agent Engine.

```bash
make setup-dev-env    # Provision Firestore + service accounts + buckets via Terraform
make deploy-agent     # Deploy ADK agent to Vertex Agent Engine
make deploy-api       # Deploy FastAPI backend to Cloud Run
make deploy-frontend  # Build and deploy React app to Firebase Hosting
make deploy           # All three deploys in sequence
make register-gemini-enterprise  # Register agent with Gemini Enterprise
```

### CI/CD pipeline

Three Cloud Build triggers are defined in `deployment/terraform/dev/cloudbuild.tf`
(created when `enable_cicd_triggers = true`):

| Trigger | Event | Config | Purpose |
|---------|-------|--------|---------|
| `pr-checks` | PR to `main` | `.cloudbuild/pr_checks.yaml` | Unit + integration tests, frontend build |
| `deploy-staging` | Push to `main` | `.cloudbuild/staging.yaml` | Deploy agent → API → load test → frontend → trigger prod |
| `deploy-prod` | Manual (from staging) | `.cloudbuild/deploy-to-prod.yaml` | Canary deploy (10% → verify → 100%) to production |

Staging → Prod promotion:
1. Push to `main` triggers `deploy-staging`.
2. Staging deploys agent, API, runs load tests, deploys frontend.
3. If load tests pass, staging runs `gcloud beta builds triggers run deploy-prod`.
4. Prod deploys via Cloud Run canary (10% traffic → health check → 100%).

### Local data layout

- Emulator data is persisted in `emulator-data/` (git-ignored).
- All locally stored data lives under `data/` — images in `data/images/`,
  user document uploads in `data/uploads/`.
- `data/images/` is served as static files at `/uploads/images/`.
- The frontend build output goes to `frontend/build/` and is served by the
  backend at `/` in production. The catch-all SPA route in `expose_app.py`
  excludes `ws`, `feedback`, `assets`, `api`, and `uploads` so those prefixes
  return 404 instead of being shadowed by `index.html`. The catch-all is only
  registered when `LOCAL_DEV` is unset.

A `.gcloudignore` at the repository root keeps unnecessary files (e.g.,
`node_modules`, `.venv`, `.git`, `.terraform`) out of Cloud Run source deploys.

## Common tasks

### Adding a new API endpoint
1. Add the route in the appropriate `app/api/*.py` file with the right
   `Depends(...)` for learner/admin access.
2. If it needs a new collection, create `app/db/<name>.py` with the repository
   functions (`get`, `list_*`, `create`, `update`, `delete`) returning
   `dict[str, Any]` with `id` included.
3. Import and register the router in `app/app_utils/expose_app.py` if it's a
   new module.

### Adding a new frontend page
1. Create the page component in `frontend/src/pages/`.
2. Add the route in `frontend/src/App.tsx` with the appropriate guard
   (`RequireAuth`, `RequireAdmin`, etc.).
3. Use the shared `HandDrawnCard`, `HandDrawnButton`, `HandDrawnInput`
   components.
4. Use `API_BASE` and `useAuth()` from `frontend/src/config/endpoints.ts` and
   `frontend/src/contexts/AuthContext.tsx` for backend calls.

### Adding a new Firestore collection
1. Create `app/db/<collection>.py` following the existing pattern (see
   `courses.py`).
2. Use `get_firestore_client()` — it returns the emulator client
   automatically when `FIRESTORE_EMULATOR_HOST` is set.
3. All functions should return `dict[str, Any]` with `id` included, and set
   `updated_at` on mutations.

### Modifying agent behavior
1. Agent definitions are in `app/agents/`.
2. Each agent loads its system prompt from the `system_prompts` Firestore
   collection (by `language_id` + `type`).
3. The router agent (`router_agent.py`) delegates to sub-agents based on
   user-selected mode.
4. The ADK live model is `gemini-live-2.5-flash-native-audio`.

## Working practices

- Inspect `git status` before editing and preserve unrelated user changes.
- Make the smallest coherent change; avoid drive-by refactors and
  generated-file churn.
- Do not hand-edit `frontend/build/`, `frontend/tsconfig.tsbuildinfo`,
  emulator state, caches, logs, or lockfiles unless the task genuinely changes
  them.
- Update documentation when commands, configuration, architecture, or user
  behavior changes.
- Do not run deployments, Terraform applies, database mutations, or other
  external-state changes unless the user explicitly requests them.