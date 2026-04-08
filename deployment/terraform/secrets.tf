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

# ====================================================================
# Google Secret Manager
# ====================================================================
#
# Usage:
#   Set `secret_ids` in terraform.tfvars to provision secrets:
#
#     secret_ids = {
#       "firebase-api-key"           = "placeholder"
#       "gemini-api-key"             = "placeholder"
#       "database-url"               = "placeholder"
#     }
#
#   After `terraform apply`, update secret values via:
#     gcloud secrets versions add SECRET_ID --data-file=-
#
# The app service account already has `roles/secretmanager.secretAccessor`
# (see variables.tf → app_sa_roles) so the application can read secrets
# at runtime without any additional IAM changes.
# ====================================================================

# Create secrets in each deploy project
resource "google_secret_manager_secret" "app_secrets" {
  for_each = {
    for pair in setproduct(keys(local.deploy_project_ids), keys(var.secret_ids)) :
    "${pair[0]}_${pair[1]}" => {
      project   = local.deploy_project_ids[pair[0]]
      env       = pair[0]
      secret_id = pair[1]
    }
  }

  project   = each.value.project
  secret_id = "${var.project_name}-${each.value.secret_id}"

  replication {
    auto {}
  }

  labels = {
    managed_by  = "terraform"
    environment = each.value.env
    app         = var.project_name
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# Grant the app service account access to each secret
resource "google_secret_manager_secret_iam_member" "app_sa_secret_access" {
  for_each = {
    for pair in setproduct(keys(local.deploy_project_ids), keys(var.secret_ids)) :
    "${pair[0]}_${pair[1]}" => {
      project   = local.deploy_project_ids[pair[0]]
      env       = pair[0]
      secret_id = pair[1]
    }
  }

  project   = each.value.project
  secret_id = google_secret_manager_secret.app_secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_sa[each.value.env].email}"

  depends_on = [google_secret_manager_secret.app_secrets]
}
