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

### Quick deploy (manual)

```bash
export PROJECT_ID=<your-project-id>
make configure      # check that everything is set up correctly
make setup-dev-env  # one-time: provisions Firestore, APIs, GCS buckets, IAM via Terraform
make deploy         # deploy agent + API + frontend to the active gcloud project
```

`make deploy` is a **manual deploy** using `gcloud` and `firebase` CLI. It targets the project set in the `PROJECT_ID` environment variable (or falls back to the active gcloud project). It does **not** run Terraform.

For step-by-step deploys:

```bash
make deploy-agent      # deploy ADK agent to Vertex Agent Engine
make deploy-api        # deploy FastAPI service to Cloud Run
make deploy-frontend   # deploy React frontend to Firebase Hosting
```

Notes:
- `make deploy-agent` auto-uses `${PROJECT_ID}-language-coach-app@${PROJECT_ID}.iam.gserviceaccount.com` when it exists.
- `make deploy-api` reads `deployment_metadata.json` from `make deploy-agent` unless you set `REMOTE_AGENT_ENGINE_ID=projects/.../reasoningEngines/...`.
- `make deploy-frontend` auto-discovers the API URL from Cloud Run unless you set `FRONTEND_API_BASE_URL` and `FRONTEND_WS_BASE_URL`.

### Infrastructure provisioning (Terraform)

`make setup-dev-env` runs Terraform in `deployment/terraform/dev/` to provision the dev/staging project:

| Resource | Purpose |
|----------|---------|
| Firestore database (`language-coach-db`) | Application data |
| GCS buckets (`*-logs`, `*-images`) | Log storage and image uploads |
| Service account (`language-coach-app`) | Runtime identity for agent and API |
| Cloud Build triggers (`pr-checks`, `deploy-staging`, `deploy-prod`) | CI/CD pipeline |

Cloud Build triggers are **not created by default**; set `enable_cicd_triggers = true` in `deployment/terraform/dev/vars/env.tfvars` to enable them.

For multi-project setups (separate staging and production), apply the root Terraform workspace:

```bash
cd deployment/terraform
terraform init
terraform apply --var-file ../vars/env.tfvars
```

### CI/CD pipeline

When `enable_cicd_triggers = true`, pushes to `main` automatically trigger staging deployment, followed by a canary release to production:

| Trigger | Event | Purpose |
|---------|-------|---------|
| `pr-checks` | PR to `main` | Unit tests, integration tests, frontend build |
| `deploy-staging` | Push to `main` | Deploy agent → API → load test → frontend → trigger prod |
| `deploy-prod` | Triggered by staging | Canary deploy (10% traffic → health check → 100%) |

See `deployment/README.md` for the full deployment architecture and Cloud Build configuration details.

### Environment variables

The application uses environment variables for both **backend runtime** and **frontend build-time** configuration.

#### Backend (set at deploy time via `--set-env-vars`)

| Variable | Required | Set by | Description |
|----------|----------|--------|-------------|
| `GOOGLE_CLOUD_PROJECT_ID` | ✅ | Deploy scripts | GCP project ID |
| `GOOGLE_CLOUD_PROJECT` | ✅ | Deploy scripts | Alias for `GOOGLE_CLOUD_PROJECT_ID` |
| `GOOGLE_CLOUD_REGION` | ✅ | Deploy scripts | GCP region (e.g., `europe-west1`) |
| `LOGS_BUCKET_NAME` | ✅ | Deploy scripts | GCS bucket for telemetry logs |
| `IMAGES_BUCKET_NAME` | ✅ | Deploy scripts | GCS bucket for image uploads |
| `ALLOWED_ORIGINS` | ⚠️ | Deploy scripts | CORS origins. Defaults to Firebase Hosting URL. **Set explicitly in production.** |
| `LOCAL_DEV` | ❌ | — | Set to `true` for local development only |
| `FIRESTORE_EMULATOR_HOST` | ❌ | — | Local Firestore emulator endpoint |
| `FIREBASE_AUTH_EMULATOR_HOST` | ❌ | — | Local Auth emulator endpoint |
| `REDIS_HOST` | ❌ | — | Redis host for caching (not provisioned in dev workspace) |
| `REDIS_PORT` | ❌ | — | Redis port (defaults to `6379`) |
| `COMMIT_SHA` | ❌ | CI/CD | Git commit SHA for telemetry attribution |
| `UPLOAD_BUCKET` | ❌ | — | GCS bucket for document uploads (defaults to `language-coach-uploads`) |

#### Frontend (set at build time via `VITE_*`)

| Variable | Required | Set by | Description |
|----------|----------|--------|-------------|
| `VITE_API_BASE_URL` | ✅ | Deploy scripts | Backend API base URL |
| `VITE_WS_BASE_URL` | ✅ | Deploy scripts | WebSocket base URL |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Deploy scripts | Firebase project ID |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Deploy scripts | Firebase auth domain |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Deploy scripts | Firebase storage bucket |
| `VITE_FIREBASE_API_KEY` | ⚠️ | Deploy scripts | Firebase API key (public) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ⚠️ | Deploy scripts | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ⚠️ | Deploy scripts | Firebase app ID |
| `VITE_LOCAL_DEV` | ❌ | — | Set to `true` for local dev (connects to Auth Emulator) |

**Production Firebase config:** The deploy scripts auto-derive `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, and `VITE_FIREBASE_STORAGE_BUCKET` from `PROJECT_ID`. You must explicitly set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` when running `make deploy-frontend`:

```bash
make deploy-frontend \
  VITE_FIREBASE_API_KEY=your-key \
  VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id \
  VITE_FIREBASE_APP_ID=your-app-id
```

Or export them beforehand. Run `make configure` to see the current values.
