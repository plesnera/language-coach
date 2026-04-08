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
# Cloud Monitoring – Dashboards & Notification Channels
# ====================================================================

# Email notification channel for alerts
resource "google_monitoring_notification_channel" "email" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} Alert Email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# Cloud Monitoring dashboard – key metrics at a glance
resource "google_monitoring_dashboard" "app_dashboard" {
  for_each       = local.deploy_project_ids
  project        = each.value
  dashboard_json = jsonencode({
    displayName = "${var.project_name} – ${each.key} Overview"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Request Count (Cloud Run)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        },
        {
          title = "Request Latency p50/p95/p99"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_PERCENTILE_95"
                  }
                }
              }
            }]
          }
        },
        {
          title = "5xx Error Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
                }
              }
            }]
          }
        },
        {
          title = "Container CPU Utilisation"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/cpu/utilizations\""
                }
              }
            }]
          }
        },
        {
          title = "Container Memory Utilisation"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\""
                }
              }
            }]
          }
        },
        {
          title = "Firestore Read/Write Operations"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"firestore.googleapis.com/Database\" AND metric.type=\"firestore.googleapis.com/document/read_count\""
                }
              }
            }]
          }
        },
      ]
    }
  })

  depends_on = [resource.google_project_service.deploy_project_services]
}
