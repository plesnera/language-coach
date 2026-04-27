# ==============================================================================
# Root Terraform Variables
# ==============================================================================
# These values are used by the root Terraform workspace (deployment/terraform/)
# for multi-project setups with separate staging and production projects.
#
# For single-project dev/staging, use deployment/terraform/dev/vars/env.tfvars
# and run `make setup-dev-env` instead.
# ==============================================================================

# Project name used for resource naming
project_name = "language-coach"

# Your Production Google Cloud project id
prod_project_id = "your-production-project-id"

# Your Staging / Test Google Cloud project id
staging_project_id = "your-staging-project-id"

# Your Google Cloud project ID that will be used to host the Cloud Build pipelines.
cicd_runner_project_id = "your-cicd-project-id"
# Name of the host connection you created in Cloud Build
host_connection_name = "git-language-coach"
github_pat_secret_id = "your-github_pat_secret_id"

repository_owner = "Your GitHub organization or username."

# Name of the repository you added to Cloud Build
repository_name = "language-coach"

# The Google Cloud region you will use to deploy the infrastructure
region = "europe-west1"
