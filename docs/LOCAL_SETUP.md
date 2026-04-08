# Local Development Setup

## Prerequisites

- **Python 3.10+** — backend runtime
- **Node.js 20+** — frontend tooling and Firebase CLI
- **uv** — Python dependency manager (`pip install uv`)
- **Firebase CLI** — `npm install -g firebase-tools`
- **Docker** (optional) — for `docker-compose` workflow

## Quick Start

```bash
# 1. Install Python dependencies
uv sync

# 2. Start Firebase emulators (auth + firestore)
firebase emulators:start --only auth,firestore --project demo-test

# 3. In a new terminal — start the backend
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
GOOGLE_CLOUD_PROJECT=demo-test \
LOCAL_DEV=true \
uv run python -m app.app_utils.expose_app --mode local

# 4. In a new terminal — start the frontend
cd frontend && npm ci && npm run dev
```

The backend runs on `http://localhost:8000`, the frontend on `http://localhost:8501`.

## Docker Compose (Alternative)

```bash
cp .env.docker.example .env.docker
docker compose up
```

This starts the emulators, backend, and frontend with a single command.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FIRESTORE_EMULATOR_HOST` | — | Firestore emulator address (e.g. `localhost:8080`) |
| `FIREBASE_AUTH_EMULATOR_HOST` | — | Auth emulator address (e.g. `localhost:9099`) |
| `GOOGLE_CLOUD_PROJECT` | — | GCP project ID (use `demo-test` locally) |
| `LOCAL_DEV` | `false` | Disables Cloud Logging, enables dev helpers |
| `DEV_FIRESTORE_PROJECT_ID` | — | Optional: real GCP Firestore project for dev |
| `REDIS_HOST` | — | Redis host (leave empty to disable caching) |
| `ALLOWED_ORIGINS` | `*` | CORS origins (comma-separated in prod) |

## Seed Data

On first startup the backend automatically seeds:
- Default Spanish language
- Spanish for Beginners course with 4 lessons
- Default system prompts
- A local test user (`local-test-user@localhost` / `devpassword`, admin role)
