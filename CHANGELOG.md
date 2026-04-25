# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.0] - 2026-04-25

### Added
- Batch audio transcription utility with speaker diarization (`app/app_utils/batch_audio_transcription.py`). Uses Mistral AI (`voxtral-mini-latest`) with error recovery and progress tracking.

### Changed
- Removed `python-dotenv` / `load_dotenv()` from production entry points (`app/agent_engine_app.py`, `app/agents/setup.py`, `app/app_utils/expose_app.py`) so the app relies on injected environment variables in production.
- `app/db/client.py` now uses the named database `language-coach-db` in production while keeping the Firestore emulator on `(default)` for local development.
- Bumped `google-adk` to `>=1.27.5,<1.28.0` and `google-cloud-aiplatform` to `>=1.146.0,<2.0.0`.
- Updated Python target version to 3.13 in `pyproject.toml` and Ruff config.

### Fixed
- `app/agents/prompt_loader.py` exception handling now correctly wraps all Firestore errors while preserving self-raised `RuntimeError` messages.
- `app/db/client.py` no longer breaks local development when `FIRESTORE_EMULATOR_HOST` is set.
- Terraform IAM roles corrected from `roles/datastore.owner` to `roles/datastore.user` for least privilege.
- Fixed typo in filename: `batch_audio_transciption.py` → `batch_audio_transcription.py`.

### Infrastructure
- Terraform service account naming and API comments cleaned up.
- Firestore Terraform now provisions the `language-coach-db` database.

