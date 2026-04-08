# Deployment Guide

## Architecture

The application is deployed on Google Cloud:
- **Agent Engine** — hosts the ADK agent (Vertex AI)
- **Cloud Run** — serves the FastAPI API
- **Firebase Hosting** — serves the React frontend
- **Firestore** — document database
- **Cloud Build** — CI/CD pipelines
- **Memorystore (Redis)** — optional caching layer

## Terraform

All infrastructure is provisioned via Terraform in `deployment/terraform/`.

```bash
cd deployment/terraform
terraform init
terraform plan -var-file=your.tfvars
terraform apply -var-file=your.tfvars
```

Key variable files: `variables.tf` (all configurable inputs), `locals.tf` (computed values).

## CI/CD Pipelines

### PR Checks (`.cloudbuild/pr_checks.yaml`)
Runs on every pull request — installs deps, runs tests.

### Staging (`.cloudbuild/staging.yaml`)
Triggered on merge to main:
1. Deploys agent to staging
2. Deploys API to Cloud Run (staging)
3. Runs load tests
4. Deploys frontend to Firebase Hosting (staging)
5. Triggers prod deployment

### Production (`.cloudbuild/deploy-to-prod.yaml`)
Triggered by staging pipeline:
1. Deploys agent to production
2. Deploys API as canary revision (no traffic)
3. Routes 10% traffic to canary
4. Verifies health endpoint
5. Promotes canary to 100% (or rolls back)
6. Deploys frontend to Firebase Hosting (production)

## Environment Promotion

```
PR → pr_checks → merge → staging → (load test) → prod (canary → promote)
```

## Monitoring

- Cloud Monitoring dashboard: request count, latency (p50/p95/p99), error rate, instance count
- Alert policies: 5xx rate > 1%, p99 latency > 5s, absence of requests
- Alerts sent to the email configured in `var.alert_email`
