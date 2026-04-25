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

locals {
  services = [
    "aiplatform.googleapis.com",
   /* "agentengine.googleapis.com",  # Required for Vertex Agent Engine*/
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "bigquery.googleapis.com",
    "discoveryengine.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
    "iam.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "logging.googleapis.com",
    "cloudtrace.googleapis.com",
    "telemetry.googleapis.com",
  ]
}

resource "google_project_service" "services" {
  count              = length(local.services)
  project            = var.dev_project_id
  service            = local.services[count.index]
  disable_on_destroy = false
}

# Note: google_project_service_identity is not a valid resource type
# The Vertex AI service account is automatically created when the API is enabled
# If you need to reference it, use:
# data "google_project_service_identity" "vertex_sa" {
#   provider = google.dev_billing_override
#   project  = var.dev_project_id
#   service  = "aiplatform.googleapis.com"
# }
