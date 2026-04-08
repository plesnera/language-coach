# ADR-001: Use Firestore in Native Mode

## Status
Accepted

## Context
The application needs a document database for storing languages, courses, lessons, user progress, conversations, and system prompts. The two main options within GCP are Firestore in Native mode and Firestore in Datastore mode.

## Decision
We use **Firestore in Native mode** for all environments (dev, staging, production).

## Rationale
- **Real-time subscriptions** — Native mode supports real-time listeners, which may be needed for live session features.
- **Sub-collections** — lessons are stored as sub-collections under courses, which maps naturally to Firestore's document model.
- **Firebase Auth integration** — Native mode integrates directly with Firebase Authentication and Firebase Hosting.
- **Emulator support** — the Firebase Emulator Suite provides local development support with full Firestore and Auth emulation.
- **Simpler SDK** — the `google-cloud-firestore` Python SDK and Firebase JS SDK provide first-class Native mode support.

## Consequences
- Cannot switch to Datastore mode in the same project (one-time choice per project).
- No SQL-like query capabilities — complex aggregations require BigQuery (already set up via telemetry pipeline).
- 1 write per second per document limit applies — acceptable for our scale.

## Alternatives Considered
- **Datastore mode** — better for high-write throughput but lacks real-time listeners and sub-collections.
- **Cloud SQL (PostgreSQL)** — full SQL but higher operational overhead, cold-start latency on Cloud Run, and no built-in emulator.
