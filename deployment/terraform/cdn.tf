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
# Cloud CDN — Backend Bucket for static assets
# ====================================================================

resource "google_compute_backend_bucket" "frontend_cdn" {
  for_each    = var.cdn_enabled ? local.deploy_project_ids : {}
  project     = each.value
  name        = "${var.project_name}-frontend-cdn-${each.key}"
  bucket_name = google_storage_bucket.images_bucket[each.value].name
  enable_cdn  = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    client_ttl                   = 3600
    serve_while_stale            = 86400
    signed_url_cache_max_age_sec = 0
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}
