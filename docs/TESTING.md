# Testing Guide

## Backend Tests (pytest)

```bash
# Unit tests (no emulator required)
uv run pytest tests/unit/

# Integration tests (requires emulators running)
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
GOOGLE_CLOUD_PROJECT=demo-test \
uv run pytest tests/integration/
```

Tests requiring the emulator are marked with `@pytest.mark.requires_emulator` and are automatically skipped if `FIRESTORE_EMULATOR_HOST` is not set.

## Frontend Unit Tests (Vitest)

```bash
cd frontend
npm run test
```

Component tests live in `frontend/src/__tests__/`. Uses `jsdom` environment with `@testing-library/react`.

## Frontend E2E Tests (Playwright)

```bash
cd frontend

# Install browsers (first time only)
npx playwright install

# Run all E2E tests (requires dev server running on port 8501)
npx playwright test

# Run specific test file
npx playwright test tests/navigation.spec.ts

# Run with UI
npx playwright test --ui
```

E2E tests live in `frontend/tests/`. Includes:
- `app.spec.ts` — main page loads
- `auth.spec.ts` — authentication
- `navigation.spec.ts` — route guards, public pages
- `guest-flow.spec.ts` — unauthenticated user journey
- `admin.spec.ts` — admin route protection
- `accessibility.spec.ts` — WCAG checks via axe-core

## Load Tests

```bash
uv run --with locust==2.31.1 --with websockets \
  locust -f tests/load_test/load_test.py \
  -H http://localhost:8000 \
  --headless -t 30s -u 2 -r 1
```

## Linting & Type Checking

```bash
# Ruff (linter + formatter)
uv run ruff check .
uv run ruff format --check .

# Type checking
uv run ty check

# Spell checking
uv run codespell
```
