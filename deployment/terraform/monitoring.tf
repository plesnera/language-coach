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
# Cloud Monitoring Dashboard for Language Coach
# ====================================================================

resource "google_monitoring_dashboard" "cloud_run_dashboard" {
  for_each = local.deploy_project_ids
  project  = each.value
  dashboard_json = jsonencode({
    displayName = "${var.project_name} Cloud Run Dashboard (${each.key})"
    mosaicLayout = {
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Request Count"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
                plotType = "LINE"
              }]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Request Latency (p50 / p95 / p99)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_PERCENTILE_50"
                        crossSeriesReducer = "REDUCE_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                },
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_PERCENTILE_95"
                        crossSeriesReducer = "REDUCE_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                },
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_PERCENTILE_99"
                        crossSeriesReducer = "REDUCE_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                },
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "5xx Error Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
                plotType = "LINE"
              }]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Container Instance Count"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/instance_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
                plotType = "LINE"
              }]
            }
          }
        },
      ]
    }
  })

  depends_on = [resource.google_project_service.deploy_project_services]
}

# ====================================================================
# SLO: API Availability >= 99.5%
# ====================================================================

resource "google_monitoring_slo" "api_availability" {
  for_each     = local.deploy_project_ids
  project      = each.value
  service      = "ist:${each.value}-cloud-run-${var.project_name}"
  display_name = "${var.project_name} API Availability (${each.key})"

  goal                = 0.995
  rolling_period_days = 28

  request_based_sli {
    good_total_ratio {
      total_service_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
      good_service_filter  = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class!=\"5xx\""
    }
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}

# ====================================================================
# SLO: p99 Latency <= 5s
# ====================================================================

resource "google_monitoring_slo" "api_latency" {
  for_each     = local.deploy_project_ids
  project      = each.value
  service      = "ist:${each.value}-cloud-run-${var.project_name}"
  display_name = "${var.project_name} API Latency p99 (${each.key})"

  goal                = 0.99
  rolling_period_days = 28

  request_based_sli {
    distribution_cut {
      distribution_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      range {
        max = 5000
      }
    }
  }

  depends_on = [resource.google_project_service.deploy_project_services]
}
