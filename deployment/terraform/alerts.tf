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
# Cloud Monitoring Alert Policies
# ====================================================================

# Alert: High 5xx error rate (> 5% of requests over 5 minutes)
resource "google_monitoring_alert_policy" "high_error_rate" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} – High 5xx Error Rate (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "5xx error rate > 5%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email[each.key].name
  ]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [google_monitoring_notification_channel.email]
}

# Alert: High request latency (p95 > 5s over 5 minutes)
resource "google_monitoring_alert_policy" "high_latency" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} – High Latency p95 (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "Request latency p95 > 5s"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5000  # milliseconds
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email[each.key].name
  ]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [google_monitoring_notification_channel.email]
}

# Alert: Container restart (instance count drops to 0)
resource "google_monitoring_alert_policy" "container_restarts" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} – No Running Instances (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "Running instance count = 0"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/instance_count\""
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email[each.key].name
  ]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [google_monitoring_notification_channel.email]
}
