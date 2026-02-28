# Feature Roadmap — Language Coach

## Product Vision

A dialogue-oriented language learning application that helps English-speaking users learn a second language through AI-powered conversational practice. The initial full feature set targets **Spanish**, with the architecture designed for straightforward addition of other languages.

## Current State

The project is scaffolded from `agent-starter-pack` (v0.33.2) and runs on the Google ADK (`google-adk`) with a Gemini Live native-audio model.

- **Backend**: Python/FastAPI, single `root_agent` in `app/agent.py` with a generic language-teacher system prompt. No database, no auth, no multi-agent routing.
- **Frontend**: React 18 + TypeScript + Vite. A single `RootPage` with a push-to-talk `AudioController` connected over WebSocket. No routing beyond `/` (and a dev-only `/debug`). No user accounts, no mode selection.
- **Data**: ~90 "Language Transfer – Complete Spanish" MP3 lesson files exist under `data/spanish/beginner/audio/`. No transcriptions, no structured course content.
- **Infrastructure**: Terraform for GCP, Cloud Build CI/CD, Agent Engine deployment. No persistent datastore configured (`session_type = in_memory`, `datastore = none`).

---
# How to develop
1. Rule of Modularity: Write simple parts connected by clean interfaces.
2. Rule of Clarity: Clarity is better than cleverness.
3. Rule of Composition: Design programs to be connected to other programs.
4. Rule of Separation: Separate policy from mechanism; separate interfaces from engines.
5. Rule of Simplicity: Design for simplicity; add complexity only where you must.
6. Rule of Parsimony: Write a big program only when it is clear by demonstration that nothing else will do.
7. Rule of Transparency: Design for visibility to make inspection and debugging easier.
8. Rule of Robustness: Robustness is the child of transparency and simplicity.
9. Rule of Representation: Fold knowledge into data so program logic can be stupid and robust.
10. Rule of Least Surprise: In interface design, always do the least surprising thing.
11. Rule of Silence: When a program has nothing surprising to say, it should say nothing.
12. Rule of Repair: When you must fail, fail noisily and as soon as possible.
13. Rule of Economy: Programmer time is expensive; conserve it in preference to machine time.
14. Rule of Generation: Avoid hand-hacking; write programs to write programs when you can.
15. Rule of Optimization: Prototype before polishing. Get it working before you optimize it.
16. Rule of Diversity: Distrust all claims for "one true way".
17. Rule of Extensibility: Design for the future, because it will be here sooner than you think.

---
# Phase 0 — Foundation

Establish the shared infrastructure that all subsequent features depend on.

## F0.1 — Persistent Datastore

**Goal**: Replace in-memory state with a persistent store so that user data, sessions, course content, prompts, and uploaded documents survive restarts.

**Details**:

- Choose and provision a datastore. Firestore (Native mode) is the natural fit given the GCP stack; it provides schemaless documents, real-time listeners, and IAM integration out of the box.
- Create Terraform resources for the Firestore database in `deployment/terraform/`.
- Define the initial top-level collections (these will be extended by later features):
  - `users` — user profile and auth metadata
  - `languages` — language definitions (initially one document: Spanish)
  - `courses` — beginner-track course content
  - `topics` — topic-based conversation definitions
  - `system_prompts` — admin-managed prompts linked to a language
  - `conversations` — per-user conversation history
  - `uploaded_documents` — metadata for user-uploaded content
- Add `google-cloud-firestore` to `pyproject.toml`.
- Create a thin data-access layer in `app/db/` with a client factory and per-collection repository modules (e.g. `app/db/users.py`, `app/db/courses.py`).

## F0.2 — Language Model

**Goal**: Introduce a `Language` entity so every content and prompt feature can be scoped to a language, making multi-language support a configuration concern rather than a code change.

**Details**:

- Firestore document schema for `languages` collection:
  - `id` (string, e.g. `es`)
  - `name` (string, e.g. `Spanish`)
  - `enabled` (bool)
  - `created_at`, `updated_at`
- Seed the collection with a single `es` / `Spanish` document on first deploy (or via an admin API).
- All subsequent features that deal with content (courses, topics, system prompts) store a `language_id` foreign key referencing this collection.

## F0.3 — Authentication & User Accounts

**Goal**: Allow users to register, log in, and recover passwords.

**Details**:

- Use **Firebase Authentication** (email/password provider). It shares the same GCP project and integrates with Firestore security rules.
- Backend:
  - Add `firebase-admin` to `pyproject.toml`.
  - Create `app/auth/` module with a FastAPI dependency (`get_current_user`) that verifies the Firebase ID token from the `Authorization: Bearer <token>` header.
  - Expose REST endpoints under `/api/auth/`:
    - `POST /api/auth/register` — creates Firebase user + Firestore `users` document (fields: `uid`, `email`, `display_name`, `role` defaulting to `user`, `created_at`).
    - `POST /api/auth/login` — returns Firebase custom token (or delegates fully to client SDK).
    - `POST /api/auth/forgot-password` — triggers Firebase password-reset email.
  - Define two roles: `user` and `admin`. Store `role` in the Firestore `users` document and mirror it as a Firebase custom claim for use in security rules.
- Frontend:
  - Add `firebase` JS SDK.
  - Create pages: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`.
  - Add an `AuthContext` provider wrapping the app; expose `user`, `login()`, `register()`, `logout()`, `resetPassword()`.
  - Protect all application routes behind auth. Redirect unauthenticated users to `/login`.
  - Admin-only routes (Phase 3) gated by `role === 'admin'`.

## F0.4 — API Layer Restructure

**Goal**: Introduce a proper REST API alongside the existing WebSocket/ADK endpoint so that CRUD operations (courses, topics, prompts, files) have standard HTTP endpoints.

**Details**:

- Create a FastAPI `APIRouter` mounted at `/api/` in the existing app (alongside the ADK live endpoint).
- Sub-routers: `/api/auth/`, `/api/courses/`, `/api/topics/`, `/api/prompts/`, `/api/documents/`, `/api/admin/`, `/api/languages/`.
- All non-auth endpoints require a valid Firebase token. Admin endpoints additionally check `role === 'admin'`.
- Expose the app via `app/app_utils/expose_app.py` as today, just with the additional routers registered.

## F0.5 — Multi-Agent Routing Architecture

**Goal**: Replace the single `root_agent` with a router agent that delegates to specialised sub-agents for each use case.

**Details**:

- Refactor `app/agent.py` into a package `app/agents/` containing:
  - `router_agent.py` — the new `root_agent`. Receives the user's chosen mode and routes to the correct sub-agent.
  - `beginner_agent.py` — handles Use Case 1 (beginner dialogue track).
  - `topic_agent.py` — handles Use Case 2 (topic-based conversations).
  - `freestyle_agent.py` — handles Use Case 3 (free-style talk).
- Each sub-agent receives its own system prompt (loaded from the `system_prompts` Firestore collection for the active language). Fallback to a hardcoded default if no DB prompt exists yet.
- The router agent inspects a `mode` parameter sent from the frontend at session start (see F1.0) and transfers control to the appropriate sub-agent.
- Update `app/agent_engine_app.py` to import from `app/agents/router_agent.py`.
- Keep each agent in its own file to allow independent iteration.

---

# Phase 1 — Core Learning Use Cases

## F1.0 — Mode Selection UI

**Goal**: After login the user lands on a dashboard where they choose one of the three learning modes.

**Details**:

- New `DashboardPage` at `/` (post-login).
- Three cards:
  1. **Beginner Track** — "Start from scratch" (links to `/learn`).
  2. **Topic Conversation** — "Pick a topic" (links to `/topics`).
  3. **Free Talk** — "Talk about anything" (links to `/talk`).
- The selected mode is sent to the backend as a parameter when establishing the WebSocket/ADK session, so the router agent knows which sub-agent to activate.
- Show the user's display name and a language selector (initially only Spanish is enabled).

## F1.1 — Beginner Dialogue Track (Use Case 1)

**Goal**: A structured, Socratic-method course where the agent teaches language fundamentals through turn-based teacher-student dialogue.

**Details**:

- **Course data model** (`courses` collection):
  - `id`, `language_id`, `title`, `description`, `sort_order`, `created_at`, `updated_at`.
  - Sub-collection `lessons`:
    - `id`, `sort_order`, `title`, `objective` (what the student should learn), `teaching_prompt` (detailed instructions for the agent on how to teach this lesson — explains concepts, example sentences, exercises to pose), `source_audio_ref` (optional ref to the original MP3 in GCS), `source_transcript` (optional transcription text), `created_at`, `updated_at`.
- **Agent behaviour** (`beginner_agent.py`):
  - On session start, look up the user's progress (Firestore `users/{uid}/progress/{course_id}` sub-collection storing `current_lesson_index`).
  - Load the `teaching_prompt` for the current lesson and inject it as the agent's dynamic instruction.
  - The agent explains a concept, gives examples in Spanish with English translations, then asks the student to try (e.g. "How would you say …?").
  - After the student responds, the agent provides correction or encouragement, and may pose follow-up drills.
  - When the agent judges the student has grasped the lesson objective, it advances `current_lesson_index` and moves to the next lesson.
  - If no courses/lessons exist yet, the agent falls back to a generic beginner introduction and informs the user that structured content is coming soon.
- **Frontend** (`/learn` route):
  - Shows current course name, lesson number/title, and the objective.
  - Audio interaction panel (reuse `AudioController`).
  - A "Next Lesson" / "Repeat Lesson" control for manual override.
  - Progress bar showing position within the course.

## F1.2 — Topic-Based Conversation (Use Case 2)

**Goal**: Let users pick a pre-defined topic (or upload their own document) and have a guided conversation around it.

**Details**:

- **Topic data model** (`topics` collection):
  - `id`, `language_id`, `title`, `description`, `conversation_prompt` (system instructions for the agent to steer the conversation around this topic), `sort_order`, `is_default` (shipped with app vs. admin-created), `created_at`, `updated_at`.
- Seed three default topics for Spanish:
  1. "What I did on my last vacation" — prompt guides the agent to ask about travel, places, activities; introduces past-tense vocabulary.
  2. "About my family" — prompt covers family members, descriptions, relationships.
  3. "My job and other jobs" — prompt covers professions, daily routines, workplace vocabulary.
- **Agent behaviour** (`topic_agent.py`):
  - Receives the selected `topic_id` (or an `uploaded_document_id`) as a session parameter.
  - Loads the `conversation_prompt` for the topic and uses it as the system instruction.
  - If an uploaded document is provided instead, the agent receives the extracted text as context and converses about its content (see F2.1 for upload/extraction).
  - The agent drives conversation, asks questions, and gently corrects the user's language.
- **Frontend** (`/topics` route):
  - Grid/list of available topics (fetched from `/api/topics/?language_id=es`).
  - Each card shows title and description; clicking starts a session.
  - An "Upload your own" button opens a file-upload dialog (see F2.1). After processing, the uploaded document appears as a selectable topic card.
  - Audio interaction panel.

## F1.3 — Free-Style Talk (Use Case 3)

**Goal**: Open-ended conversation with no fixed topic — the agent simply chats with the user in the target language.

**Details**:

- **Agent behaviour** (`freestyle_agent.py`):
  - Uses the language-level system prompt from `system_prompts` (linked to `es`), or falls back to a default: "You are a friendly conversational partner. Speak in Spanish. Gently correct mistakes. Adjust complexity to the user's level."
  - No structured content dependency — this mode works out of the box.
- **Frontend** (`/talk` route):
  - Minimal UI: audio interaction panel and a small note explaining the mode.
  - Optional: a text input for the user to suggest a starting topic (passed as an initial user message).

---

# Phase 2 — Content Processing Pipeline

Tools that administrators (and, for uploads, regular users) use to create and manage learning content.

## F2.1 — File Upload & Text Extraction

**Goal**: Allow users to upload documents (PDF, TXT, MD, DOCX) that become conversation material for Use Case 2.

**Details**:

- **Backend** (`app/services/document_processing.py`):
  - `POST /api/documents/upload` — accepts multipart file upload. Authenticated; any logged-in user can upload.
  - Validate file type (allowed: `.pdf`, `.txt`, `.md`, `.docx`).
  - Store the raw file in a GCS bucket (`language-coach-uploads/{user_id}/{uuid}.{ext}`).
  - Extract plain text:
    - PDF: use `PyMuPDF` (`fitz`).
    - DOCX: use `python-docx`.
    - TXT / MD: read directly.
  - Store metadata in Firestore `uploaded_documents`: `id`, `user_id`, `filename`, `gcs_path`, `extracted_text`, `content_type`, `created_at`.
  - Return the document ID and a preview of the extracted text.
- **Frontend**:
  - Upload component on the `/topics` page (drag-and-drop or file picker).
  - Shows upload progress and a preview of extracted text.
  - On success, the document appears as a selectable conversation topic.
- Add `PyMuPDF` and `python-docx` to `pyproject.toml`.

## F2.2 — Audio Transcription Tool

**Goal**: Enable administrators to transcribe MP3 audio files (like the ~90 lesson files in `data/spanish/beginner/audio/`) into text that can be used as course material.

**Details**:

- **Backend** (`app/services/audio_transcription.py`):
  - `POST /api/admin/transcribe` — accepts an audio file (MP3) or a GCS path. Admin-only.
  - Use the **Google Cloud Speech-to-Text API** (v2 / Chirp model) for transcription.
    - Configure for Spanish audio (`language_code: es-ES`).
    - For long files, use the `LongRunningRecognize` async method.
  - Return the full transcript text.
  - Optionally store the transcript against the source audio in Firestore (e.g. update a `lessons` document's `source_transcript` field).
- **Batch mode**: provide a management command or admin endpoint to transcribe all files in `data/spanish/beginner/audio/` in bulk, storing results in Firestore.
- Add `google-cloud-speech` to `pyproject.toml`.

## F2.3 — AI Summarisation Tool

**Goal**: After transcription, allow administrators to generate an AI summary of the transcript. The summarisation prompt is editable, stored in the app, and reusable.

**Details**:

- **Summarisation prompts** — stored in Firestore `system_prompts` collection with `type: summarisation`:
  - `id`, `language_id`, `type` (`summarisation`), `name` (human label, e.g. "Beginner lesson summariser"), `prompt_text`, `created_at`, `updated_at`.
- **Backend** (`app/services/summarisation.py`):
  - `POST /api/admin/summarise` — accepts `{ transcript_text, prompt_id }`. Admin-only.
  - Loads the referenced prompt from Firestore.
  - Calls Gemini (text model, e.g. `gemini-2.0-flash`) with the prompt + transcript as input.
  - Returns the summary.
  - The administrator can review, edit, and then save the summary as lesson content (updating the `teaching_prompt` field of a `lessons` document).
- **Frontend** (admin UI, see F3.1):
  - After transcription completes, a "Summarise" button appears.
  - Admin selects a summarisation prompt from a dropdown (fetched from `/api/prompts/?type=summarisation&language_id=es`).
  - Shows the generated summary in an editable text area.
  - "Save to lesson" button pushes the edited summary into the course/lesson structure.

---

# Phase 3 — Administration

## F3.0 — Admin UI Shell

**Goal**: A separate section of the frontend accessible only to users with `role === 'admin'`.

**Details**:

- New route prefix `/admin` protected by role check in the frontend router.
- Sidebar navigation with links to: Courses, Topics, System Prompts, Audio Tools, Users.
- Layout: sidebar + main content area.
- If a non-admin user navigates to `/admin`, redirect to `/`.

## F3.1 — Course Management (Beginner Track)

**Goal**: Admins can create, edit, reorder, and delete courses and their lessons for Use Case 1.

**Details**:

- **Endpoints** (all admin-only):
  - `GET /api/admin/courses/?language_id=es` — list courses.
  - `POST /api/admin/courses/` — create course `{ language_id, title, description }`.
  - `PUT /api/admin/courses/{id}` — update course.
  - `DELETE /api/admin/courses/{id}` — delete course and its lessons.
  - `GET /api/admin/courses/{id}/lessons` — list lessons.
  - `POST /api/admin/courses/{id}/lessons` — create lesson `{ title, objective, teaching_prompt, sort_order }`.
  - `PUT /api/admin/courses/{id}/lessons/{lesson_id}` — update lesson.
  - `DELETE /api/admin/courses/{id}/lessons/{lesson_id}` — delete lesson.
  - `PUT /api/admin/courses/{id}/lessons/reorder` — batch update `sort_order`.
- **Frontend** (`/admin/courses`):
  - Course list with create/edit/delete.
  - Clicking a course opens its lesson list.
  - Drag-and-drop reordering of lessons.
  - Lesson editor: fields for title, objective, teaching prompt (rich text or markdown), optional link to source audio/transcript.
  - Integrated "Transcribe" and "Summarise" buttons (invoking F2.2 and F2.3) to assist in authoring `teaching_prompt` from audio files.

## F3.2 — Topic Management

**Goal**: Admins can create, edit, and delete conversation topics for Use Case 2.

**Details**:

- **Endpoints** (admin-only):
  - `CRUD /api/admin/topics/` — same pattern as courses. Fields: `language_id`, `title`, `description`, `conversation_prompt`, `sort_order`.
- **Frontend** (`/admin/topics`):
  - Topic list with create/edit/delete.
  - Topic editor: title, description, conversation prompt (text area).

## F3.3 — System Prompt Management

**Goal**: Admins can define, edit, and assign system prompts to a language. These prompts control agent behaviour for each mode, as well as summarisation.

**Details**:

- **Data model** (`system_prompts` collection):
  - `id`, `language_id`, `type` (enum: `beginner`, `topic`, `freestyle`, `summarisation`), `name`, `prompt_text`, `is_active` (bool — at most one active prompt per `language_id` + `type` pair), `created_at`, `updated_at`.
- **Endpoints** (admin-only):
  - `CRUD /api/admin/prompts/`.
  - `POST /api/admin/prompts/{id}/activate` — sets `is_active = true` and deactivates siblings.
- **Frontend** (`/admin/prompts`):
  - List prompts grouped by type.
  - Editor with a large text area for `prompt_text`.
  - Toggle to activate/deactivate.
- **Agent integration**: Each sub-agent on session start queries for the active prompt matching its type and the session's `language_id`. If found, it uses that as its instruction; otherwise it falls back to its hardcoded default.

## F3.4 — User Management

**Goal**: Admins can view users, change roles, and disable accounts.

**Details**:

- **Endpoints** (admin-only):
  - `GET /api/admin/users/` — paginated list.
  - `PUT /api/admin/users/{uid}/role` — update role (`user` / `admin`).
  - `PUT /api/admin/users/{uid}/disable` — disable/enable account.
- **Frontend** (`/admin/users`):
  - User table with columns: email, display name, role, created date, status.
  - Inline role toggle and disable button.

---

# Phase 4 — Polish & Extensibility

## F4.1 — Conversation History

**Goal**: Persist user conversations so they can be reviewed later.

**Details**:

- Store each session's transcript in Firestore `conversations` collection: `id`, `user_id`, `language_id`, `mode`, `topic_id` (nullable), `messages` (array of `{ role, text, timestamp }`), `created_at`.
- Frontend: a "History" page (`/history`) showing past conversations grouped by date, with playback/review.

## F4.2 — Progress Tracking & Analytics

**Goal**: Show users their learning progress; give admins aggregate usage data.

**Details**:

- User-facing: lessons completed, time spent per mode, streak tracking. Displayed on the dashboard.
- Admin-facing: aggregate stats on `/admin` dashboard — active users, popular topics, average session length.

## F4.3 — Adding a New Language

**Goal**: Document and streamline the process for adding support for another language.

**Details** — adding a new language requires only data-level changes, no code changes:

1. Create a new document in `languages` (e.g. `{ id: "fr", name: "French", enabled: true }`).
2. Create system prompts for the new language (one per type: beginner, topic, freestyle, summarisation).
3. Create courses and/or topics linked to the new `language_id`.
4. The frontend language selector automatically picks up new enabled languages.
5. Agents load prompts dynamically by `language_id` — no agent code changes needed.

## F4.4 — Testing Strategy

**Goal**: Ensure each feature is delivered with adequate test coverage.

**Details**:

- **Backend unit tests** (`tests/unit/`): test each repository module, service function, and auth dependency in isolation using mocked Firestore.
- **Backend integration tests** (`tests/integration/`): test API endpoints with a Firestore emulator.
- **Frontend tests** (`frontend/src/**/*.test.tsx`): component tests with React Testing Library; route protection tests; context provider tests.
- **Agent evaluation** (`evaluation/`): use the existing ADK evaluation framework to assert agent behaviour for each mode (correct language, stays on topic, follows teaching prompt).
- Run all tests via `make test` (backend) and `cd frontend && npm test` (frontend).

---

# Implementation Priority & Dependencies

**Phase 0** (Foundation): F0.1 → F0.2 → F0.3 → F0.4 → F0.5 (sequential; each builds on the last).

**Phase 1** (Core Use Cases): F1.0 first, then F1.1, F1.2, F1.3 can proceed in parallel.

**Phase 2** (Content Pipeline): F2.1 is independent. F2.2 then F2.3 are sequential.

**Phase 3** (Admin): F3.0 first (shell), then F3.1–F3.4 in parallel. F3.1 depends on F2.2 + F2.3 for integrated transcription/summarisation.

**Phase 4** (Polish): All items are independent of each other but depend on Phases 0–3 being complete.
