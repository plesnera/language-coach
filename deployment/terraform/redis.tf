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
# Redis (Memorystore) for caching
# ====================================================================

resource "google_redis_instance" "cache" {
  for_each       = local.deploy_project_ids
  project        = each.value
  name           = "${var.project_name}-cache-${each.key}"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  redis_version = "REDIS_7_0"

  display_name = "${var.project_name} Cache (${each.key})"

  depends_on = [resource.google_project_service.deploy_project_services]
}
