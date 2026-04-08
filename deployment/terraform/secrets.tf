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
# Google Secret Manager — secrets provisioned from var.secret_ids
# ====================================================================

locals {
  # Flatten: for every (env, secret_name) create a unique key
  secret_entries = {
    for pair in setproduct(keys(local.deploy_project_ids), keys(var.secret_ids)) :
    "${pair[0]}_${pair[1]}" => {
      env       = pair[0]
      project   = local.deploy_project_ids[pair[0]]
      secret_id = pair[1]
      initial   = var.secret_ids[pair[1]]
    }
  }
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each  = local.secret_entries
  project   = each.value.project
  secret_id = each.value.secret_id

  replication {
    auto {}
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

resource "google_secret_manager_secret_version" "app_secret_versions" {
  for_each    = local.secret_entries
  secret      = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value.initial

  lifecycle {
    # After initial creation the real value is set outside Terraform
    ignore_changes = [secret_data]
  }
}

# Grant the application service account access to each secret
resource "google_secret_manager_secret_iam_member" "app_sa_accessor" {
  for_each  = local.secret_entries
  project   = each.value.project
  secret_id = google_secret_manager_secret.app_secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_sa[each.value.env].email}"
}
