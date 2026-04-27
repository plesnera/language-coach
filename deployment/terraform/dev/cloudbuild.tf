# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Reference the existing GitHub connection (created manually or via root Terraform)
data "google_cloudbuildv2_connection" "github" {
  location = var.region
  name     = var.github_connection_name
}

resource "google_cloudbuildv2_repository" "language_coach" {
  location          = var.region
  name              = var.github_repo_name
  parent_connection = data.google_cloudbuildv2_connection.github.id
  remote_uri        = "https://github.com/${var.github_repo_owner}/${var.github_repo_name}.git"
}

# PR checks trigger — runs on pull requests to main
resource "google_cloudbuild_trigger" "pr_checks" {
  count    = var.enable_cicd_triggers ? 1 : 0
  location = var.region
  name     = "pr-checks"
  filename = ".cloudbuild/pr_checks.yaml"

  repository_event_config {
    repository = google_cloudbuildv2_repository.language_coach.id
    pull_request {
      branch = "main"
    }
  }

  substitutions = {
    _PROJECT_ID       = var.dev_project_id
    _LOGS_BUCKET_NAME = google_storage_bucket.logs_data_bucket.name
  }

  depends_on = [resource.google_project_service.services]
}

# Staging deploy trigger — runs on push to main
resource "google_cloudbuild_trigger" "deploy_staging" {
  count    = var.enable_cicd_triggers ? 1 : 0
  location = var.region
  name     = "deploy-staging"
  filename = ".cloudbuild/staging.yaml"

  repository_event_config {
    repository = google_cloudbuildv2_repository.language_coach.id
    push {
      branch = "main"
    }
  }

  substitutions = {
    _STAGING_PROJECT_ID          = var.dev_project_id
    _REGION                      = var.region
    _API_SERVICE_NAME            = "${var.project_name}-api"
    _DEPLOY_DISPLAY_NAME         = var.project_name
    _PROD_DEPLOY_TRIGGER_NAME    = "deploy-prod"
    _FRONTEND_API_BASE_URL       = ""
    _FRONTEND_WS_BASE_URL        = ""
    _APP_SERVICE_ACCOUNT_STAGING = google_service_account.app_sa.email
    _LOGS_BUCKET_NAME_STAGING    = google_storage_bucket.logs_data_bucket.name
    _IMAGES_BUCKET_NAME_STAGING  = google_storage_bucket.images_bucket.name
    _ALLOWED_ORIGINS             = ""
  }

  depends_on = [resource.google_project_service.services]
}

# Production deploy trigger — triggered manually by staging pipeline after load tests pass
resource "google_cloudbuild_trigger" "deploy_prod" {
  count    = var.enable_cicd_triggers ? 1 : 0
  location = var.region
  name     = "deploy-prod"
  filename = ".cloudbuild/deploy-to-prod.yaml"

  repository_event_config {
    repository = google_cloudbuildv2_repository.language_coach.id
  }

  substitutions = {
    _PROD_PROJECT_ID          = var.dev_project_id
    _REGION                   = var.region
    _API_SERVICE_NAME         = "${var.project_name}-api"
    _DEPLOY_DISPLAY_NAME      = var.project_name
    _FRONTEND_API_BASE_URL    = ""
    _FRONTEND_WS_BASE_URL     = ""
    _CANARY_PERCENT           = "10"
    _APP_SERVICE_ACCOUNT_PROD = google_service_account.app_sa.email
    _LOGS_BUCKET_NAME_PROD    = google_storage_bucket.logs_data_bucket.name
    _IMAGES_BUCKET_NAME_PROD  = google_storage_bucket.images_bucket.name
    _ALLOWED_ORIGINS          = ""
  }

  depends_on = [resource.google_project_service.services]
}
