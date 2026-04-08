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
# Firestore Backup – GCS Bucket for Exports
# ====================================================================
#
# Firestore managed backups are configured via `google_firestore_backup_schedule`.
# This creates a daily backup schedule for each deploy environment.
#
# To manually export:
#   gcloud firestore export gs://BUCKET_NAME --project=PROJECT_ID
# ====================================================================

# GCS bucket for Firestore backup exports
resource "google_storage_bucket" "firestore_backup" {
  for_each                    = local.deploy_project_ids
  project                     = each.value
  name                        = "${each.value}-${var.project_name}-firestore-backups"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  lifecycle_rule {
    condition {
      age = var.firestore_backup_retention_days
    }
    action {
      type = "Delete"
    }
  }

  versioning {
    enabled = true
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# Daily backup schedule for Firestore
resource "google_firestore_backup_schedule" "daily" {
  for_each = local.deploy_project_ids
  project  = each.value
  database = google_firestore_database.default[each.key].name

  retention = "${var.firestore_backup_retention_days * 24 * 3600}s"

  daily_recurrence {}

  depends_on = [google_firestore_database.default]
}
