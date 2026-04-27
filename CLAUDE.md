## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`.

---

## Project Overview

**language-coach** is a real-time AI language learning app. Learners have voice conversations with an AI coach. Admins manage courses, lessons, and topics via a web-based admin panel.

**Stack:**
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Google Cloud Firestore, Firebase Auth
- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS v4, React Router v7, Lucide icons
- **AI:** Google ADK (Agent Developer Kit), Vertex AI, voice/realtime WebSocket sessions
- **Auth:** Firebase Admin SDK — `verify_id_token()` in production; Auth Emulator locally
- **Storage:** Firestore (all data), local filesystem or GCS bucket for image uploads

---

## Project Structure

```
app/
  api/           # FastAPI routers (admin.py, conversations.py, courses.py, ...)
  auth/          # Firebase token verification (dependencies.py), auth router
  db/            # Firestore repository functions (courses.py, users.py, ...)
  agents/        # ADK agent definitions
  app_utils/     # App startup, seeding, expose_app.py
  services/      # Audio transcription, summarisation
frontend/
  src/
    components/  # HandDrawnButton, HandDrawnCard, HandDrawnInput, DoodleDecorations
    pages/       # LandingPage, LearnPage, admin/AdminLessonsPage, admin/AdminCoursesPage, ...
    contexts/    # AuthContext (Firebase auth state)
tests/
  unit/          # Unit tests (no emulator needed)
  integration/   # Integration tests (require Firestore emulator)
```

---

## Local Development

**Start emulators first (required for backend + tests):**
```bash
make emulator
# Starts Firestore on :8080, Firebase Auth on :9099, Emulator UI on :4000
# Imports/exports state from ./emulator-data/
```

**Start the full stack:**
```bash
make playground       # builds frontend + starts backend at http://localhost:8000
# or for hot-reload dev:
make local-backend    # backend only (hot-reload)
make ui               # frontend only on :8501
```

**Key env vars set by `make playground` / `make local-backend`:**
- `FIRESTORE_EMULATOR_HOST=localhost:8080`
- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
- `LOCAL_DEV=true`

**Install dependencies:**
```bash
make install   # uv sync + npm install
```

---

## Testing

```bash
make test
# Runs: uv run pytest tests/unit && uv run pytest tests/integration
```

**Integration tests require the Firestore emulator running:**
- Tests marked `@pytest.mark.requires_emulator` are skipped unless `FIRESTORE_EMULATOR_HOST` is set.
- Auth tests require `FIREBASE_AUTH_EMULATOR_HOST` to also be set.

**Test patterns:**
- `seeded_client` fixture — provides a `TestClient` with seed data + admin user; uses `dependency_overrides` to bypass `get_current_user` (not a real token)
- `auth_token` fixture (pending, in `tests/conftest.py`) — creates a real Auth Emulator user, yields an ID token, cleans up after
- `emulator_project` fixture — returns the Firebase project ID (`demo-test` by default)

**Linting:**
```bash
make lint   # codespell + ruff check
```

---

## Architecture

### Auth Flow

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

All admin endpoints are under `/api/admin/` and use `Depends(require_admin)` at the router level.
Public learner endpoints are under `/api/` and use `Depends(get_current_user)`.

### Database (Firestore)

Repository pattern — `app/db/*.py` functions return plain `dict`s.

```
collections:
  courses/          {language_id, title, description, sort_order, ...}
    lessons/        {title, objective, teaching_prompt, sort_order, image_url, ...}
  topics/           {language_id, title, conversation_prompt, sort_order, ...}
  languages/        {id, name, enabled}
  users/            {uid, email, role, disabled, display_name}
  system_prompts/   {language_id, type, name, prompt_text, is_active}
  conversations/    {user_id, language_id, session data}
  progress/         {user_id, lesson_id, ...}
```

`get_firestore_client()` in `app/db/client.py` is a module-level singleton. When `FIRESTORE_EMULATOR_HOST` is set, the SDK routes to the emulator automatically — no special branch needed.

### Frontend Design System

Hand-drawn aesthetic. Key components in `frontend/src/components/`:
- `HandDrawnButton` — primary / outline variants
- `HandDrawnCard` — accepts `rotate="none" | "left" | "right"`, `border-[#DC2626]` for destructive
- `HandDrawnInput` — text input and `multiline` textarea variant
- `DoodleDecorations` — `SquigglyLine` and other decorative SVGs

**Palette:**
- Background: `#FAFAF8`
- Ink/text: `#1A1A1A`
- Red/destructive: `#DC2626`
- Amber/AI: `#F59E0B`

**Conventions:**
- Delete confirmations use `HandDrawnCard rotate="left"` modal (NOT browser `confirm()`)
- Error messages use inline `<p className="text-[#DC2626]">` (NOT browser `alert()`)
- Loading states use `<Loader2 className="animate-spin">` from lucide-react
- Empty states use dashed border + helpful action text

### Design policy (mandatory)

- `DESIGN.md` is the product design source of truth and must be followed for new UI and UX changes.
- Accessibility is a release gate: all critical flows must be keyboard operable, screen-reader understandable, and meet WCAG 2.2 AA expectations (contrast, focus visibility, semantics, labels, and error messaging).
- New users must be able to try a meaningful part of the app before signup.
- Signup should be introduced during the intro flow after a value moment, with explicit benefits:
  - Personalized curriculum
  - Tracking improvement over time
  - Chatting about topics based on user-uploaded content
- Auth gating must be progressive: at least one useful guest experience is available before requiring account creation.

---

## Key Conventions

- **Validation in API layer** (`app/api/`), not repo layer (`app/db/`). Repos are thin — they read/write Firestore, raise nothing.
- **`updated_at`** is set on every document mutation via the repo functions.
- **Firestore batch writes** use `db.batch()` for multi-document atomic operations. Max 500 ops per batch.
- **Admin UI error handling:** API calls that can fail must check `response.ok`, roll back optimistic UI updates on failure, and show an inline error.
- **No `dependency_overrides` in auth tests** — auth middleware tests use real emulator tokens.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Deploy Configuration (configured by /setup-deploy)
- **Platform:** GCP (Cloud Run + Vertex Agent Engine + Firebase Hosting)
- **Production URL:** https://language-coach.web.app
- **Deploy workflow:** Automatic on push to main (Cloud Build / CI/CD)
- **Deploy status command:** `make deploy` (manual fallback) or Cloud Build dashboard
- **Merge method:** Squash and merge
- **Project type:** Web app (FastAPI backend + React frontend)
- **Post-deploy health check:** https://language-coach.web.app/api/health

### CI/CD Pipeline

Three Cloud Build triggers are defined in `deployment/terraform/dev/cloudbuild.tf` (created via Terraform when `enable_cicd_triggers = true`):

| Trigger | Event | Config | Purpose |
|---------|-------|--------|---------|
| `pr-checks` | PR to `main` | `.cloudbuild/pr_checks.yaml` | Unit tests, integration tests, frontend build validation |
| `deploy-staging` | Push to `main` | `.cloudbuild/staging.yaml` | Deploy agent → API → load test → frontend → trigger prod |
| `deploy-prod` | Manual (from staging) | `.cloudbuild/deploy-to-prod.yaml` | Canary deploy (10% → verify → 100%) to production |

**Staging → Prod promotion flow:**
1. Push to `main` triggers `deploy-staging`
2. Staging pipeline deploys the agent, API, runs load tests, and deploys the frontend
3. If load tests pass, the staging pipeline runs `gcloud beta builds triggers run deploy-prod`
4. The prod pipeline deploys with a Cloud Run canary (10% traffic → health check → 100% traffic)

### Custom deploy hooks
- **Pre-merge:** `make test` and `make lint`
- **Deploy trigger:** Automatic via Cloud Build on merge to main (or `make deploy` manually)
- **Deploy status:** Poll production URL for 200 OK
- **Health check:** https://language-coach.web.app/health

### Deploy targets
- `make deploy-agent` — Deploy ADK agent to Vertex Agent Engine
- `make deploy-api` — Deploy FastAPI backend to Cloud Run
- `make deploy-frontend` — Deploy React frontend to Firebase Hosting
- `make deploy` — Run all three deploy targets
- `make setup-dev-env` — Provision dev infrastructure via Terraform

### Cloud Run source deploys
A `.gcloudignore` file is present at the repository root to prevent Cloud Run source deploys from uploading unnecessary files (e.g., `node_modules`, `.venv`, `.git`, `.terraform`).
