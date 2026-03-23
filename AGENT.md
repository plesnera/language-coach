# AGENT.md — Language Coach

> Reference document for AI coding agents (Claude Code, Cursor, Copilot, etc.)

## What This Project Is

A real-time voice-based language learning app. Users practice speaking a target language (currently Spanish) with an AI coach through three modes: structured beginner lessons, topic-based conversations, and free-form chat. Built on Google ADK with Gemini Live native audio.

## Tech Stack

**Backend**: Python 3.10+ / FastAPI / Google ADK (`google-adk`) / Firestore / Firebase Auth
**Frontend**: React 18 / TypeScript / Vite / Tailwind CSS 4 / SCSS / React Router 7
**Package management**: `uv` (Python), `npm` (frontend)
**AI model**: `gemini-live-2.5-flash-native-audio` via Vertex AI
**Infra**: GCP / Terraform / Cloud Build / Agent Engine

## Project Structure

```
language-coach/
├── app/                          # Python backend
│   ├── agent.py                  # Top-level ADK agent entry point
│   ├── agents/                   # ADK agent definitions
│   │   ├── router_agent.py       # Root agent — routes to sub-agents by mode
│   │   ├── beginner_agent.py     # Structured lesson agent
│   │   ├── topic_agent.py        # Topic conversation agent
│   │   ├── freestyle_agent.py    # Free-form conversation agent
│   │   ├── prompt_loader.py      # Loads system prompts from Firestore
│   │   └── setup.py              # Vertex AI / env bootstrap (imported first)
│   ├── api/                      # FastAPI REST routers
│   │   ├── admin.py              # Admin-only CRUD (/api/admin/*)
│   │   ├── courses.py            # Public course/lesson endpoints
│   │   ├── topics.py             # Public topic endpoints
│   │   ├── languages.py          # Language list endpoint
│   │   ├── progress.py           # User progress tracking
│   │   ├── conversations.py      # Conversation history
│   │   └── documents.py          # File upload/extraction
│   ├── auth/
│   │   ├── dependencies.py       # get_current_user / require_admin FastAPI deps
│   │   └── router.py             # /api/auth/* (register, login, forgot-password)
│   ├── db/                       # Firestore data-access layer
│   │   ├── client.py             # Firestore client factory (real or MemoryClient)
│   │   ├── courses.py            # courses collection + lessons sub-collection
│   │   ├── languages.py          # languages collection
│   │   ├── topics.py             # topics collection
│   │   ├── images.py             # lesson_images collection (image library)
│   │   ├── users.py              # users collection
│   │   ├── conversations.py      # conversations collection
│   │   ├── progress.py           # user progress
│   │   ├── system_prompts.py     # system_prompts collection
│   │   └── uploaded_documents.py # uploaded docs metadata
│   ├── services/
│   │   ├── audio_transcription.py
│   │   ├── document_processing.py
│   │   └── summarisation.py
│   ├── app_utils/
│   │   └── expose_app.py         # FastAPI app factory, WebSocket, static mounts
│   └── agent_engine_app.py       # Agent Engine wrapper
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── App.tsx               # Route definitions, auth guards
│   │   ├── firebase.ts           # Firebase SDK initialisation
│   │   ├── multimodal-live-types.ts  # Shared types for live audio session
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx    # Auth provider (Firebase or local-dev auto-login)
│   │   │   └── LiveAPIContext.tsx # WebSocket/ADK live session provider
│   │   ├── hooks/                # Custom React hooks (use-live-api, use-webcam, etc.)
│   │   ├── shared/               # Audio utilities, multimodal-live-client, worklets
│   │   ├── styles/               # SCSS stylesheets per page/component
│   │   ├── utils/                # General utility helpers
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Public landing (/)
│   │   │   ├── LoginPage.tsx         # /login
│   │   │   ├── SignupPage.tsx        # /signup
│   │   │   ├── ForgotPasswordPage.tsx # /forgot-password
│   │   │   ├── LearnPage.tsx         # /learn — main app hub (3 mode tabs)
│   │   │   ├── LessonSessionPage.tsx # /learn/session/:courseId/:lessonId
│   │   │   ├── TopicPage.tsx         # /topics
│   │   │   ├── TopicSessionPage.tsx  # /topics/:id
│   │   │   ├── FreestylePage.tsx     # /freestyle
│   │   │   ├── FreestyleSessionPage.tsx # /freestyle/session
│   │   │   ├── HistoryPage.tsx       # /history
│   │   │   ├── DebugPage.tsx         # /debug (dev mode only)
│   │   │   └── admin/                # /admin/* — admin-only pages
│   │   │       ├── AdminCoursesPage.tsx
│   │   │       ├── AdminLessonsPage.tsx
│   │   │       ├── AdminTopicsPage.tsx
│   │   │       ├── AdminPromptsPage.tsx
│   │   │       └── AdminUsersPage.tsx
│   │   └── components/
│   │       ├── HandDrawnButton.tsx
│   │       ├── HandDrawnCard.tsx
│   │       ├── HandDrawnInput.tsx
│   │       ├── DoodleDecorations.tsx
│   │       ├── AppNavbar.tsx
│   │       ├── AdminLayout.tsx
│   │       ├── session/          # Session UI shell
│   │       ├── audio-controller/ # Mic/speaker controls
│   │       ├── audio-pulse/      # Audio visualisation
│   │       ├── logger/           # Dev log panel
│   │       ├── side-panel/       # Collapsible side panel
│   │       └── transcription-preview/ # Live transcript display
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── load_test/
├── data/                         # All local data (audio files, uploaded images, user docs)
├── deployment/                   # Terraform + Cloud Build
├── Makefile                      # All dev/build/deploy commands
├── pyproject.toml                # Python deps + tool config
└── AGENT.md                      # ← This file
```

## How to Run

### Prerequisites
- Python 3.10–3.13
- Node.js 18+
- `uv` package manager
- GCP credentials (or use LOCAL_DEV mode)

### Local Development (no GCP needed)

```bash
# Install everything
make install

# Terminal 1: start the Firestore + Auth emulators
make emulator
# → Emulator UI at http://localhost:4000

# Terminal 2: backend (auto-seeds Firestore with sample data)
make local-backend
# → Runs on http://localhost:8000

# Terminal 3: frontend dev server
make ui
# → Runs on http://localhost:8501 with hot reload

# Or start everything at once:
make playground-dev
```

In local-dev mode:
- Firestore SDK connects to the emulator via `FIRESTORE_EMULATOR_HOST=localhost:8080`
- Firebase Auth SDK connects to the Auth Emulator via `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
- A `local-test-user@localhost` admin account is seeded in the Auth Emulator on startup
- The frontend auto-logs in as `local-test-user@localhost` against the Auth Emulator
- Data persists across restarts in `emulator-data/`

### Production-like

```bash
make playground     # Build frontend + start backend on :8000
make playground-dev # Both with hot-reload (backend :8000, frontend :8501)
```

## Key Development Patterns

### Backend API Pattern

All REST routes live under `app/api/`. Public routes require `get_current_user` dependency; admin routes require `require_admin`. Example:

```python
from app.auth.dependencies import get_current_user, require_admin

# Public endpoint
@router.get("/courses/")
def list_courses(user=Depends(get_current_user)):
    ...

# Admin endpoint — router uses dependencies=[Depends(require_admin)]
@router.post("/admin/courses/")
def create_course(body: CreateCourseRequest):
    ...
```

### Firestore Repository Pattern

Each collection has a module in `app/db/` with standard functions: `get()`, `list_*()`, `create()`, `update()`, `delete()`. All return plain dicts with `id` injected from the Firestore document ID.

```python
from app.db.client import get_firestore_client

def create(language_id: str, title: str, ...) -> dict[str, Any]:
    db = get_firestore_client()
    data = {"language_id": language_id, "title": title, ...}
    ref = db.collection(COLLECTION).document()
    ref.set(data)
    return {"id": ref.id, **data}
```

### Frontend API Calling Pattern

All pages use the same pattern for backend calls:

```typescript
const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

const { user } = useAuth();
const headers = {
  Authorization: `Bearer ${user?.token}`,
  'Content-Type': 'application/json',
};
const res = await fetch(`${API_BASE}/api/courses/`, { headers });
```

### Frontend Design System

The UI uses a hand-drawn / doodle theme with these shared components:
- `HandDrawnButton` — variant: `primary` | `outline`
- `HandDrawnCard` — rotate: `left` | `right` | `none`
- `HandDrawnInput` — supports `multiline` prop
- `DoodleDecorations` — SVG decorative elements

**Color palette**: `#FAFAF8` (background), `#1A1A1A` (ink/text), `#DC2626` (red accent), `#F59E0B` (amber accent)
**Fonts**: Lora (headings, `font-heading`), Inter (body)
**CSS classes**: `hand-drawn-border`, `hand-drawn-border-alt`, `hand-drawn-border-pill`

### Route Guards

```typescript
<RequireAuth>   — redirects to /login if not logged in
<RequireAdmin>  — redirects with access-denied if not admin
<AuthenticatedSession> — RequireAuth + LiveAPIProvider (for voice pages)
```

## API Endpoints Reference

### Public (require auth token)
- `GET /api/languages/` — list enabled languages
- `GET /api/courses/?language_id=X` — list courses for a language
- `GET /api/courses/{id}/lessons` — list lessons in a course
- `GET /api/courses/{id}/lessons/{lesson_id}` — single lesson detail
- `GET /api/topics/?language_id=X` — list topics
- `GET /api/progress/` — user's learning progress
- `GET /api/conversations/` — conversation history
- `POST /api/documents/upload` — upload a document

### Auth
- `POST /api/auth/register` — `{ email, password, display_name }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/forgot-password` — `{ email }`

### Admin (require admin role)
- `CRUD /api/admin/languages`
- `CRUD /api/admin/courses` — `?language_id=X` for listing
- `CRUD /api/admin/courses/{id}/lessons` — includes `/reorder` endpoint
- `CRUD /api/admin/topics`
- `CRUD /api/admin/prompts` — includes `/{id}/activate`
- `GET/PUT /api/admin/users/` — list, update role, disable
- `GET /api/admin/images` — image library
- `POST /api/admin/images/upload` — upload image (multipart)
- `POST /api/admin/transcribe` — audio transcription
- `POST /api/admin/summarise` — AI transcript summarisation

### WebSocket
- `ws://host/ws` — ADK live bidirectional audio session

## Firestore Collections

- `languages` — `{id, name, enabled}`
- `courses` — `{language_id, title, description, sort_order}`
  - sub-collection `lessons` — `{title, objective, teaching_prompt, sort_order, image_url, source_audio_ref, source_transcript}`
- `topics` — `{language_id, title, description, conversation_prompt, sort_order}`
- `system_prompts` — `{language_id, type, name, prompt_text, is_active}`
- `users` — `{uid, email, display_name, role, disabled, created_at}`
- `conversations` — `{user_id, language_id, mode, messages[], created_at}`
- `lesson_images` — `{filename, url, original_name, created_at}`
- `uploaded_documents` — `{user_id, filename, gcs_path, extracted_text}`

## Testing

```bash
# Backend (pytest)
make test                    # unit + integration
uv run pytest tests/unit     # unit only

# Frontend (vitest)
cd frontend && npm test      # watch mode
cd frontend && npx vitest run  # single run

# Type checking
cd frontend && npx tsc --noEmit

# Linting (backend)
make lint                    # codespell + ruff + ty
```

## Common Tasks

### Adding a new API endpoint
1. Add route function in the appropriate `app/api/*.py` file
2. If it needs a new collection, create `app/db/<name>.py` with the repository functions
3. Import and include the router in `app/app_utils/expose_app.py` if it's a new router

### Adding a new frontend page
1. Create the page component in `frontend/src/pages/`
2. Add the route in `frontend/src/App.tsx` with the appropriate guard (`RequireAuth`, `RequireAdmin`, etc.)
3. Use the shared `HandDrawnCard`, `HandDrawnButton`, `HandDrawnInput` components
4. Follow the `API_BASE` + `useAuth()` pattern for API calls

### Adding a new Firestore collection
1. Create `app/db/<collection>.py` following the existing pattern (see `courses.py`)
2. Use `get_firestore_client()` — this automatically returns the in-memory mock in LOCAL_DEV mode
3. All functions should return `dict[str, Any]` with `id` included

### Modifying the agent behavior
1. Agent definitions are in `app/agents/`
2. Each agent loads its system prompt from the `system_prompts` Firestore collection (by `language_id` + `type`)
3. The router agent (`router_agent.py`) delegates to sub-agents based on user-selected mode
4. The ADK live model is `gemini-live-2.5-flash-native-audio`

## Environment Variables

- `FIRESTORE_EMULATOR_HOST=localhost:8080` — routes Firestore SDK to the emulator
- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` — routes Firebase Auth SDK to the emulator
- `LOCAL_DEV=true` — used by service stubs to return mock values when GCP APIs are unavailable
- `VITE_LOCAL_DEV=true` — frontend connects to Auth Emulator and auto-logs in
- `VITE_FIREBASE_API_KEY` — if unset, frontend defaults to local-dev mode
- `GOOGLE_CLOUD_PROJECT` — GCP project ID (auto-detected from credentials)
- `GOOGLE_CLOUD_LOCATION` — defaults to `europe-west1`
- `GOOGLE_GENAI_USE_VERTEXAI=True` — required for ADK

## Seed Data

On startup (`expose_app.py`), the backend automatically seeds:
- Languages: Spanish (`es`)
- Courses: "Spanish for Beginners" with 4 lessons (Greetings, Numbers, Restaurant, Directions)
- Topics: 3 default conversation topics (Vacation, Family, Jobs)
- System Prompts: one active prompt per agent type (router, beginner, topic, freestyle)
- Auth Emulator user: `local-test-user@localhost` (admin) when running against the emulator

Seed functions are in each db module's `seed_defaults()` method.

## Important Notes

- Emulator data is stored in `emulator-data/` (git-ignored) for persistence across restarts
- All locally stored data lives under `data/` — images in `data/images/`, user document uploads in `data/uploads/`
- `data/images/` is served as static files at `/uploads/images/` — it's mounted in `expose_app.py`
- The frontend build output goes to `frontend/build/` and is served by the backend at `/` in production
- The catch-all SPA route in `expose_app.py` excludes: `ws`, `feedback`, `assets`, `api`, `uploads`
- All backend code uses `from __future__ import annotations` for forward-compatible type hints
- Pydantic models use `BaseModel` with `model_dump()` — this is Pydantic v2
- The frontend uses Tailwind CSS v4 (no `tailwind.config.js` — config is in CSS `@theme`)
