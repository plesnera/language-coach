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
# Production Firestore Configuration
# ====================================================================
# The base Firestore database is created in firestore.tf.
# This file adds production-specific indexes for query performance.

# Composite index: user progress queries (by user + language)
resource "google_firestore_index" "progress_by_user_language" {
  for_each   = local.deploy_project_ids
  project    = each.value
  database   = google_firestore_database.default[each.key].name
  collection = "progress"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "language_code"
    order      = "ASCENDING"
  }
  fields {
    field_path = "updated_at"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}

# Composite index: conversations by user (most recent first)
resource "google_firestore_index" "conversations_by_user" {
  for_each   = local.deploy_project_ids
  project    = each.value
  database   = google_firestore_database.default[each.key].name
  collection = "conversations"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}
