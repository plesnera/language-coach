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
# Email Notification Channel
# ====================================================================

resource "google_monitoring_notification_channel" "email" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} Alert Email (${each.key})"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# ====================================================================
# Alert: 5xx Error Rate > 1%
# ====================================================================

resource "google_monitoring_alert_policy" "high_error_rate" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} High 5xx Error Rate (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "5xx error rate exceeds 1%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      duration        = "300s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email[each.key].name]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# ====================================================================
# Alert: p99 Latency > 5s
# ====================================================================

resource "google_monitoring_alert_policy" "high_latency" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} High p99 Latency (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "p99 latency exceeds 5 seconds"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5000
      duration        = "300s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email[each.key].name]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# ====================================================================
# Alert: Low Request Volume (potential outage indicator)
# ====================================================================

resource "google_monitoring_alert_policy" "low_traffic" {
  for_each     = var.alert_email != "" ? local.deploy_project_ids : {}
  project      = each.value
  display_name = "${var.project_name} Absence of Requests (${each.key})"
  combiner     = "OR"

  conditions {
    display_name = "No requests for 10 minutes"
    condition_absent {
      filter   = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
      duration = "600s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email[each.key].name]

  alert_strategy {
    auto_close = "1800s"
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}
