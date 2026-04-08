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

variable "project_name" {
  type        = string
  description = "Project name used as a base for resource naming"
  default     = "language-coach"
}

variable "prod_project_id" {
  type        = string
  description = "**Production** Google Cloud Project ID for resource deployment."
}

variable "staging_project_id" {
  type        = string
  description = "**Staging** Google Cloud Project ID for resource deployment."
}

variable "cicd_runner_project_id" {
  type        = string
  description = "Google Cloud Project ID where CI/CD pipelines will execute."
}

variable "region" {
  type        = string
  description = "Google Cloud region for resource deployment."
  default     = "europe-west1"
}

variable "host_connection_name" {
  description = "Name of the host connection to create in Cloud Build"
  type        = string
  default     = "language-coach-github-connection"
}

variable "repository_name" {
  description = "Name of the repository you'd like to connect to Cloud Build"
  type        = string
}

variable "app_sa_roles" {
  description = "List of roles to assign to the application service account"
  type        = list(string)
  default = [

    "roles/aiplatform.user",
    "roles/datastore.user",
    "roles/discoveryengine.editor",
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
    "roles/storage.admin",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/monitoring.viewer",
    "roles/secretmanager.secretAccessor",
  ]
}

variable "cicd_roles" {
  description = "List of roles to assign to the CICD runner service account in the CICD project"
  type        = list(string)
  default = [
    "roles/storage.admin",
    "roles/aiplatform.user",
    "roles/discoveryengine.editor",
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
    "roles/artifactregistry.writer",
    "roles/cloudbuild.builds.builder"
  ]
}

variable "cicd_sa_deployment_required_roles" {
  description = "List of roles to assign to the CICD runner service account for the Staging and Prod projects."
  type        = list(string)
  default = [
    "roles/iam.serviceAccountUser",
    "roles/aiplatform.user",
    "roles/storage.admin",
    "roles/run.admin",
    "roles/cloudbuild.builds.editor",
    "roles/artifactregistry.writer",
    "roles/firebasehosting.admin"
  ]
}


variable "repository_owner" {
  description = "Owner of the Git repository - username or organization"
  type        = string
}


variable "github_app_installation_id" {
  description = "GitHub App Installation ID for Cloud Build"
  type        = string
  default     = null
}


variable "github_pat_secret_id" {
  description = "GitHub PAT Secret ID created by gcloud CLI"
  type        = string
  default     = null
}

variable "create_cb_connection" {
  description = "Flag indicating if a Cloud Build connection already exists"
  type        = bool
  default     = false
}

variable "create_repository" {
  description = "Flag indicating whether to create a new Git repository"
  type        = bool
  default     = false
}


variable "feedback_logs_filter" {
  type        = string
  description = "Log Sink filter for capturing feedback data. Captures logs where the `log_type` field is `feedback`."
  default     = "jsonPayload.log_type=\"feedback\" jsonPayload.service_name=\"language-coach\""
}

# ── Monitoring & Alerts ──────────────────────────────────────────────────────

variable "alert_email" {
  type        = string
  description = "Email address for monitoring alert notifications. Leave empty to disable alerts."
  default     = ""
}

# ── Secrets Management ──────────────────────────────────────────────────────

variable "secret_ids" {
  type        = map(string)
  description = "Map of secret name to initial value placeholder. Values should be set via `terraform.tfvars` or CI/CD."
  default     = {}
}

# ── Firestore Production ────────────────────────────────────────────────────

variable "firestore_backup_schedule" {
  type        = string
  description = "Cron schedule for Firestore daily backups (in Cloud Scheduler format)."
  default     = "0 2 * * *"  # 2:00 AM daily
}

variable "firestore_backup_retention_days" {
  type        = number
  description = "Number of days to retain Firestore backups."
  default     = 30
}

