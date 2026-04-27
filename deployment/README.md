# Deployment

This directory contains the Terraform configurations and Cloud Build pipelines for provisioning the Google Cloud infrastructure and CI/CD for the **language-coach** project.

> This project was originally bootstrapped with the [Google Cloud Agent Starter Pack](https://googlecloudplatform.github.io/agent-starter-pack/). The deployment structure and many conventions are inherited from that framework.

---

## Architecture

The deployment is split into two Terraform workspaces:

### 1. Root Terraform (`deployment/terraform/`)

Manages **cross-project and production-grade infrastructure** across the CICD runner project, staging project, and production project.

| File | Purpose |
|------|---------|
| `providers.tf` | Terraform provider configuration (Google Cloud, GitHub) |
| `github.tf` | Cloud Build v2 GitHub connection and repository linking |
| `build_triggers.tf` | Cloud Build triggers for PR checks, staging deploy, and prod deploy |
| `service_accounts.tf` | Dedicated service accounts for CICD, staging, and production |
| `iam.tf` | IAM bindings for cross-project service account permissions |
| `storage.tf` | GCS buckets for logs and build artifacts |
| `firestore.tf` / `firestore_prod.tf` | Firestore databases and backup schedules |
| `firestore_backup.tf` | Backup retention and Cloud Scheduler jobs |
| `redis.tf` | Memorystore Redis instances per environment |
| `cdn.tf` | Cloud CDN configuration for static assets |
| `waf.tf` | Cloud Armor WAF security policies |
| `monitoring.tf` / `alerts.tf` | Uptime checks, dashboards, and alert policies |
| `telemetry.tf` | Log sinks for agent telemetry and feedback data |
| `secrets.tf` | Secret Manager entries for runtime configuration |
| `outputs.tf` | Exported values (e.g., `redis_host`, `redis_port`) |

### 2. Dev Terraform (`deployment/terraform/dev/`)

Manages **project-specific resources** for the development GCP project (also used as the single project for staging in this setup).

| File | Purpose |
|------|---------|
| `providers.tf` | Provider configuration for the dev project |
| `apis.tf` | Enables required GCP APIs (Cloud Run, Firestore, Cloud Build, etc.) |
| `firestore.tf` | Firestore database (`language-coach-db`) |
| `storage.tf` | GCS buckets for logs and images |
| `iam.tf` | Application service account (`language-coach-app`) and Cloud Build service account IAM |
| `cloudbuild.tf` | Cloud Build triggers referencing the existing GitHub connection |
| `outputs.tf` | Exported values (`app_service_account_email`, `logs_bucket_name`, etc.) |
| `telemetry.tf` / `variables.tf` | Telemetry log sinks and input variables |

---

## CI/CD Pipeline

Three Cloud Build triggers orchestrate the full deployment lifecycle. They are defined in `deployment/terraform/dev/cloudbuild.tf` and are only created when `enable_cicd_triggers = true`.

| Trigger | Event | Config | Purpose |
|---------|-------|--------|---------|
| `pr-checks` | PR to `main` | `.cloudbuild/pr_checks.yaml` | Runs unit tests, integration tests, and frontend build validation |
| `deploy-staging` | Push to `main` | `.cloudbuild/staging.yaml` | Deploys agent → API → runs load tests → deploys frontend → triggers prod |
| `deploy-prod` | Triggered by staging | `.cloudbuild/deploy-to-prod.yaml` | Canary deploy to Cloud Run (10% → health check → 100%) |

### Promotion Flow

1. A PR merged into `main` triggers `deploy-staging`.
2. The staging pipeline deploys the Vertex AI agent, the FastAPI service to Cloud Run, runs a 30-second Locust load test, and deploys the frontend to Firebase Hosting.
3. If all tests pass, the staging pipeline invokes `gcloud beta builds triggers run deploy-prod`.
4. The production pipeline deploys a canary revision with 10% traffic, verifies `/api/health`, and promotes to 100% on success. On failure, it rolls back automatically.

---

## Cloud Build Configurations

| File | Description |
|------|-------------|
| `.cloudbuild/pr_checks.yaml` | Installs Python deps, runs backend unit/integration tests, validates frontend build |
| `.cloudbuild/staging.yaml` | Full staging deploy with agent, API, load test, frontend, and prod trigger |
| `.cloudbuild/deploy-to-prod.yaml` | Production deploy with Cloud Run canary, health verification, and Firebase Hosting deploy |

### Substitution variables

All configs use substitution variables injected by Terraform triggers or passed at build time:

| Variable | Example | Used by |
|----------|---------|---------|
| `_STAGING_PROJECT_ID` / `_PROD_PROJECT_ID` | `my-project-123` | All deploy steps |
| `_APP_SERVICE_ACCOUNT_STAGING` / `_PROD` | `language-coach-app@...` | Agent + API deploy |
| `_LOGS_BUCKET_NAME_STAGING` / `_PROD` | `my-project-123-language-coach-logs` | Agent + API + load test export |
| `_IMAGES_BUCKET_NAME_STAGING` / `_PROD` | `my-project-123-language-coach-images` | Agent + API deploy |
| `_ALLOWED_ORIGINS` | `https://my-project-123.web.app` | API deploy (CORS) |
| `_FRONTEND_API_BASE_URL` | `https://api-xxx.run.app` | Frontend build |
| `_FRONTEND_WS_BASE_URL` | `wss://api-xxx.run.app` | Frontend build |
| `_CANARY_PERCENT` | `10` | Prod API deploy |

### Runtime environment variables

The deploy pipelines inject the following environment variables into the running services:

**Backend (agent + API):**
- `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`
- `LOGS_BUCKET_NAME` — telemetry log destination
- `IMAGES_BUCKET_NAME` — image upload destination
- `ALLOWED_ORIGINS` — CORS allowed origins (defaults to Firebase Hosting URL)
- `COMMIT_SHA` — git commit for telemetry attribution

**Frontend (build-time):**
- `VITE_API_BASE_URL`, `VITE_WS_BASE_URL` — backend endpoints
- `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET` — auto-derived from project ID
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — must be set explicitly for production builds

---

## Prerequisites

Before provisioning, ensure you have:

1. **gcloud CLI** authenticated with the target project.
2. **Terraform** installed (`>= 1.0.0`).
3. A **GitHub connection** already set up in Cloud Build (referenced by `github_connection_name`).
4. A `deployment/terraform/dev/vars/env.tfvars` file with at least:
   ```hcl
   dev_project_id = "your-dev-project-id"
   ```

---

## Provisioning Infrastructure

### Dev Project (Single-project staging setup)

```bash
make setup-dev-env
```

This runs:
```bash
cd deployment/terraform/dev && \
  terraform init && \
  terraform apply --var-file vars/env.tfvars --var dev_project_id=$PROJECT_ID --auto-approve
```

### Root Terraform (Cross-project / Production)

For multi-project setups (separate staging and production projects):

```bash
cd deployment/terraform
terraform init
terraform apply --var-file ../vars/env.tfvars --auto-approve
```

---

## Manual Deployment

The `Makefile` at the repository root provides manual deploy targets:

| Target | Description |
|--------|-------------|
| `make deploy-agent` | Deploy ADK agent to Vertex Agent Engine |
| `make deploy-api` | Deploy FastAPI backend to Cloud Run |
| `make deploy-frontend` | Deploy React frontend to Firebase Hosting |
| `make deploy` | Run all three deploy targets |
| `make setup-dev-env` | Provision dev infrastructure via Terraform |

---

## Cloud Run Source Deploys

A `.gcloudignore` file at the repository root prevents Cloud Run source deploys from uploading unnecessary files such as `node_modules`, `.venv`, `.git`, and `.terraform`.

---

## Outputs

After applying the dev Terraform, the following outputs are available:

- `app_service_account_email` — Email of the `language-coach-app` service account
- `logs_bucket_name` — GCS bucket for application logs
- `images_bucket_name` — GCS bucket for user-uploaded images
- `firestore_database_name` — Name of the Firestore database

These values are consumed by Cloud Build substitution variables and runtime environment configuration.

---

## Further Reading

- [Agent Starter Pack Deployment Guide](https://googlecloudplatform.github.io/agent-starter-pack/guide/deployment.html)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Canary Deployments](https://cloud.google.com/run/docs/rolloutsgradual-rollouts)
