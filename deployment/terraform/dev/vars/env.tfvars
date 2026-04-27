# ==============================================================================
# Dev Environment Variables
# ==============================================================================
# These values are used by the dev Terraform workspace (deployment/terraform/dev/).
#
# For `make setup-dev-env`, you can override `dev_project_id` via env var:
#   export PROJECT_ID=your-project-id
#   make setup-dev-env
#
# Or pass it explicitly:
#   make setup-dev-env PROJECT_ID=your-project-id
# ==============================================================================

# Project name used for resource naming
project_name = "language-coach"

# Your Dev Google Cloud project id
dev_project_id = "your-dev-project-id"

# The Google Cloud region you will use to deploy the infrastructure
region = "europe-west1"
