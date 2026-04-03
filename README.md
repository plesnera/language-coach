# language-coach

Real-time AI language learning app. Learners have voice conversations with an AI coach. Admins manage courses, lessons, and topics via a web-based admin panel.

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, FastAPI, Pydantic v2 |
| Database | Google Cloud Firestore |
| Auth | Firebase Auth (Admin SDK + Auth Emulator locally) |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS v4, React Router v7 |
| AI | Google ADK (Agent Developer Kit), Vertex AI, voice/realtime WebSocket |
| Storage | Local filesystem (dev) or GCS bucket (prod) for image uploads |

## Requirements

- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- [Node.js](https://nodejs.org/) — for the frontend
- [Firebase CLI](https://firebase.google.com/docs/cli) — for local emulators (`firebase emulators:start`)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) — for GCP services
- **make** — pre-installed on most Unix-based systems

## Quick Start

```bash
make install       # uv sync + npm install
make emulator      # start Firestore (:8080) + Auth (:9099) + Emulator UI (:4000)
make playground    # build frontend + start backend at http://localhost:8000
```

## Commands

| Command | Description |
|---|---|
| `make install` | Install all dependencies (Python + Node) |
| `make emulator` | Start Firebase emulators (Firestore, Auth, UI) |
| `make playground` | Build frontend and start full stack at :8000 |
| `make local-backend` | Backend only with hot-reload |
| `make ui` | Frontend only on :8501 |
| `make playground-dev` | Frontend + backend both with hot-reload |
| `make setup-dev-env` | Provision required GCP resources (Firestore, buckets, IAM) for the active project |
| `make deploy-agent` | Deploy the ADK agent to Vertex Agent Engine |
| `make deploy-api` | Deploy the API/WebSocket service to Cloud Run (remote Agent Engine mode) |
| `make deploy-frontend` | Build and deploy the frontend to Firebase Hosting |
| `make deploy` | Deploy the full stack (agent + API + frontend) |
| `make test` | Run unit and integration tests |
| `make lint` | Run codespell + ruff |

## Project Structure

```
app/
  api/           # FastAPI routers (admin.py, conversations.py, courses.py, ...)
  auth/          # Firebase token verification (dependencies.py)
  db/            # Firestore repository functions (courses.py, users.py, ...)
  agents/        # ADK agent definitions
  app_utils/     # App startup, seeding, expose_app.py
  services/      # Audio transcription, summarisation
frontend/
  src/
    components/  # HandDrawnButton, HandDrawnCard, HandDrawnInput
    pages/       # LandingPage, LearnPage, admin/AdminCoursesPage, admin/AdminLessonsPage, ...
    contexts/    # AuthContext (Firebase auth state)
tests/
  unit/          # Unit tests (no emulator needed)
  integration/   # Integration tests (require Firestore emulator)
```

## Testing

```bash
make test
```

Integration tests require the Firebase emulators to be running:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
GOOGLE_CLOUD_PROJECT=demo-test \
  uv run pytest tests/integration -v
```

Tests marked `@pytest.mark.requires_emulator` are skipped automatically when the emulator is not running.

## Auth Flow

```
Request → HTTPBearer → get_current_user()
  ├── No token → 401
  ├── firebase_auth.verify_id_token(token)
  │     └── failure → 401
  └── _require_user(uid)
        ├── No Firestore user doc → 401
        ├── user["disabled"] == True → 403
        └── return user dict
             └── require_admin(user)
                   ├── role != "admin" → 403
                   └── return user
```

All admin endpoints are under `/api/admin/` and use `Depends(require_admin)`.
Learner endpoints are under `/api/` and use `Depends(get_current_user)`.

## Deployment

```bash
gcloud config set project <your-project-id>
make setup-dev-env  # one-time per project (provisions Firestore/APIs/buckets/IAM)
make deploy         # full stack: agent + API + frontend
```
For step-by-step deploys you can run:

```bash
make deploy-agent
make deploy-api
make deploy-frontend
```

Notes:
- `make deploy-agent` auto-uses `${PROJECT_ID}-language-coach-app@${PROJECT_ID}.iam.gserviceaccount.com` when it exists.
- `make deploy-api` reads `deployment_metadata.json` from `make deploy-agent` unless you set `REMOTE_AGENT_ENGINE_ID=projects/.../reasoningEngines/...`.
- `make deploy-frontend` auto-discovers the API URL from Cloud Run unless you set `FRONTEND_API_BASE_URL` and `FRONTEND_WS_BASE_URL`.
