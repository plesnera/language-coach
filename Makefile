
# ==============================================================================
# Installation & Setup
# ==============================================================================

# Install dependencies using uv package manager
install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.8.13/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync && (cd frontend && npm install)

# ==============================================================================
# Playground Targets
# ==============================================================================

# Launch local dev playground
playground: build-frontend-if-needed
	@echo "==============================================================================="
	@echo "| 🚀 Starting your agent playground...                                        |"
	@echo "|                                                                             |"
	@echo "| 🌐 Access your app at: http://localhost:8000                               |"
	@echo "| 💡 Open http://localhost:8000 and try the guest intro flow.                |"
	@echo "|                                                                             |"
	@echo "| 🔍 IMPORTANT: Select the 'app' folder to interact with your agent.          |"
	@echo "==============================================================================="
	FIRESTORE_EMULATOR_HOST=localhost:8080 \
	FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
	LOCAL_DEV=true \
	uv run python -m app.app_utils.expose_app --mode local --local-agent app.agents.router_agent.root_agent

# ==============================================================================
# Local Development Commands
# ==============================================================================

# Start Firebase emulators (Firestore + Auth)
emulator:
	firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

# Launch local development server with hot-reload
local-backend:
	FIRESTORE_EMULATOR_HOST=localhost:8080 \
	FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
	LOCAL_DEV=true \
	uv run python -m app.app_utils.expose_app --mode local --port 8000  --local-agent app.agents.router_agent.root_agent

# ==============================================================================
# ADK Live Commands
# ==============================================================================

# Build the frontend for production
build-frontend:
	(cd frontend && npm run build)

# Build the frontend only if needed (conditional build)
build-frontend-if-needed:
	@if [ ! -d "frontend/build" ] || [ ! -f "frontend/build/index.html" ]; then \
		echo "Frontend build directory not found or incomplete. Building..."; \
		$(MAKE) build-frontend; \
	elif [ "frontend/package.json" -nt "frontend/build/index.html" ] || \
		 find frontend/src -newer frontend/build/index.html 2>/dev/null | head -1 | grep -q .; then \
		echo "Frontend source files are newer than build. Rebuilding..."; \
		$(MAKE) build-frontend; \
	else \
		echo "Frontend build is up to date. Skipping build..."; \
	fi

# Connect to remote deployed agent
playground-remote: build-frontend-if-needed
	@echo "==============================================================================="
	@echo "| 🚀 Connecting to REMOTE agent...                                           |"
	@echo "|                                                                             |"
	@echo "| 🌐 Access your app at: http://localhost:8000                               |"
	@echo "| ☁️  Connected to deployed agent engine                                      |"
	@echo "==============================================================================="
	uv run python -m app.app_utils.expose_app --mode remote

# Start the frontend UI separately for development (requires backend running separately)
ui:
	(cd frontend && PORT=8501 npm run dev)

# Launch dev playground with both frontend and backend hot-reload
playground-dev:
	@echo "==============================================================================="
	@echo "| 🚀 Starting language coach in DEV MODE...                                  |"
	@echo "|                                                                            |"
	@echo "| 🌐 Frontend: http://localhost:8501                                         |"
	@echo "| 🌐 Backend:  http://localhost:8000                                         |"
	@echo "| 🔥 Emulator: http://localhost:4000                                         |"
	@echo "| 💡 Auto-logs in as local-test-user@localhost                               |"
	@echo "| 🔄 Both frontend and backend will auto-reload on changes                   |"
	@echo "==============================================================================="
	$(MAKE) emulator &
	@sleep 3
	@echo "Starting backend server..."
	$(MAKE) local-backend &
	@echo "Starting frontend dev server..."
	$(MAKE) ui

# ==============================================================================
# Configuration
# ==============================================================================
# Resolve PROJECT_ID from environment variable first, then gcloud config.
PROJECT_ID ?= $(shell gcloud config get-value project 2>/dev/null)

# Deploy defaults (can be overridden, e.g. make deploy DEPLOY_REGION=us-central1)
DEPLOY_REGION ?= europe-west1
PROJECT_NAME ?= language-coach
DEPLOY_DISPLAY_NAME ?= language-coach
API_SERVICE_NAME ?= language-coach-api
API_SERVICE_PORT ?= 8000
API_CPU ?= 2
API_MEMORY ?= 2Gi
API_MIN_INSTANCES ?= 0
API_MAX_INSTANCES ?= 3
REMOTE_AGENT_ENGINE_ID ?=
FRONTEND_API_BASE_URL ?=
FRONTEND_WS_BASE_URL ?=

# Firebase config for frontend production builds.
# These are public values from your Firebase project.
# Get them from the Firebase console or run: firebase apps:sdkconfig WEB
VITE_FIREBASE_API_KEY ?=
VITE_FIREBASE_AUTH_DOMAIN ?=
VITE_FIREBASE_PROJECT_ID ?=
VITE_FIREBASE_STORAGE_BUCKET ?=
VITE_FIREBASE_MESSAGING_SENDER_ID ?=
VITE_FIREBASE_APP_ID ?=

# CORS origins for the backend API (defaults to the Firebase Hosting URL)
ALLOWED_ORIGINS ?=

# Interactive configuration check — reads current state and shows missing values.
# Usage: make configure
configure:
	@echo "==================================================================="
	@echo "  language-coach Configuration Check"
	@echo "==================================================================="
	@echo ""
	@echo "📌 Active project: $(PROJECT_ID)"
	@echo "   (set via \$$PROJECT_ID env var, or falls back to gcloud config)"
	@echo ""
	@echo "📌 Deploy region:  $(DEPLOY_REGION)"
	@echo "   (override with: make deploy DEPLOY_REGION=us-central1)"
	@echo ""
	@echo "📌 CI/CD triggers: $$(grep -q 'enable_cicd_triggers.*=.*true' deployment/terraform/dev/vars/env.tfvars 2>/dev/null && echo 'enabled ✅' || echo 'disabled ⚠️  (set enable_cicd_triggers = true in deployment/terraform/dev/vars/env.tfvars to enable)')"
	@echo ""
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "❌ PROJECT_ID is not set."; \
		echo "   Export it:   export PROJECT_ID=<your-project-id>"; \
		echo "   Or set it:    gcloud config set project <your-project-id>"; \
		echo ""; \
		exit 1; \
	fi
	@echo "Checking GCP resources in project $(PROJECT_ID)..."
	@echo ""
	@# Firestore
	@echo -n "  Checking Firestore database... "
	@if CLOUDSDK_CORE_DISABLE_PROMPTS=1 gcloud --quiet firestore databases describe --project="$(PROJECT_ID)" --database="language-coach-db" >/dev/null 2>&1; then \
		echo "✅ found"; \
	else \
		echo "❌ missing (run 'make setup-dev-env')"; \
	fi
	@# Service account
	@echo -n "  Checking service account... "
	@if CLOUDSDK_CORE_DISABLE_PROMPTS=1 gcloud --quiet iam service-accounts describe "$(PROJECT_NAME)-app@$(PROJECT_ID).iam.gserviceaccount.com" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		echo "✅ found"; \
	else \
		echo "❌ missing (run 'make setup-dev-env')"; \
	fi
	@# Logs bucket
	@echo -n "  Checking logs bucket... "
	@if CLOUDSDK_CORE_DISABLE_PROMPTS=1 gcloud --quiet storage buckets describe "gs://$(PROJECT_ID)-$(PROJECT_NAME)-logs" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		echo "✅ found"; \
	else \
		echo "❌ missing (run 'make setup-dev-env')"; \
	fi
	@# Images bucket
	@echo -n "  Checking images bucket... "
	@if CLOUDSDK_CORE_DISABLE_PROMPTS=1 gcloud --quiet storage buckets describe "gs://$(PROJECT_ID)-$(PROJECT_NAME)-images" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		echo "✅ found"; \
	else \
		echo "❌ missing (run 'make setup-dev-env')"; \
	fi
	@echo ""
	@echo "📌 Cloud Build connection: $$(grep 'github_connection_name' deployment/terraform/dev/vars/env.tfvars 2>/dev/null | sed 's/.*= *//' | tr -d '\"')"
	@echo "   (must be created manually in Cloud Build > Repositories before enabling CI/CD)"
	@echo ""
	@echo "📌 Manual deploy values (can be overridden via env vars):"
	@echo "   REMOTE_AGENT_ENGINE_ID  = $(REMOTE_AGENT_ENGINE_ID)"
	@echo "   FRONTEND_API_BASE_URL   = $(FRONTEND_API_BASE_URL)"
	@echo "   FRONTEND_WS_BASE_URL    = $(FRONTEND_WS_BASE_URL)"
	@echo "   ALLOWED_ORIGINS         = $(ALLOWED_ORIGINS)"
	@echo ""
	@echo "📌 Frontend Firebase config (required for production builds):"
	@echo "   VITE_FIREBASE_API_KEY             = $(VITE_FIREBASE_API_KEY)"
	@echo "   VITE_FIREBASE_AUTH_DOMAIN         = $(VITE_FIREBASE_AUTH_DOMAIN)"
	@echo "   VITE_FIREBASE_PROJECT_ID          = $(VITE_FIREBASE_PROJECT_ID)"
	@echo "   VITE_FIREBASE_STORAGE_BUCKET      = $(VITE_FIREBASE_STORAGE_BUCKET)"
	@echo "   VITE_FIREBASE_MESSAGING_SENDER_ID = $(VITE_FIREBASE_MESSAGING_SENDER_ID)"
	@echo "   VITE_FIREBASE_APP_ID              = $(VITE_FIREBASE_APP_ID)"
	@echo ""
	@echo "==================================================================="

# ==============================================================================
# Deployment Targets
# ==============================================================================

# Validate that a project is configured (env var or gcloud).
deploy-prereqs:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "❌ No active project configured."; \
		echo "   Export it:   export PROJECT_ID=<your-project-id>"; \
		echo "   Or set it:    gcloud config set project <your-project-id>"; \
		echo "   Then run:     make configure"; \
		exit 1; \
	fi; \
	echo "✅ Deploy prerequisites passed for project $(PROJECT_ID)"

# Validate that required backend cloud resources exist before agent deployment.
deploy-agent-prereqs: deploy-prereqs
	@if ! gcloud firestore databases describe --project="$(PROJECT_ID)" --database="language-coach-db" >/dev/null 2>&1; then \
		echo "❌ Firestore database 'language-coach-db' is not available in $(PROJECT_ID)."; \
		echo "Run 'make setup-dev-env' (or provision Firestore + required APIs) before deploying."; \
		exit 1; \
	fi; \
	echo "✅ Agent deployment prerequisites passed for project $(PROJECT_ID)"

# Deploy the ADK agent to Vertex Agent Engine.
# Usage: make deploy-agent [AGENT_IDENTITY=true] [DEPLOY_REGION=europe-west1]
# Set AGENT_IDENTITY=true to enable per-agent IAM identity (Preview).
deploy-agent: deploy-agent-prereqs
	@APP_SERVICE_ACCOUNT="$(PROJECT_NAME)-app@$(PROJECT_ID).iam.gserviceaccount.com"; \
	SERVICE_ACCOUNT_FLAG=""; \
	if gcloud iam service-accounts describe "$$APP_SERVICE_ACCOUNT" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		SERVICE_ACCOUNT_FLAG="--service-account=$$APP_SERVICE_ACCOUNT"; \
	else \
		echo "ℹ️  $$APP_SERVICE_ACCOUNT not found; deploying with default Agent Engine identity."; \
	fi; \
	LOGS_BUCKET_NAME="$(PROJECT_ID)-$(PROJECT_NAME)-logs"; \
	IMAGES_BUCKET_NAME="$(PROJECT_ID)-$(PROJECT_NAME)-images"; \
	EXTRA_ENV_VARS=""; \
	if gcloud storage buckets describe "gs://$$LOGS_BUCKET_NAME" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		EXTRA_ENV_VARS="LOGS_BUCKET_NAME=$$LOGS_BUCKET_NAME"; \
	else \
		echo "ℹ️  gs://$$LOGS_BUCKET_NAME not found; deploying without LOGS_BUCKET_NAME."; \
	fi; \
	if gcloud storage buckets describe "gs://$$IMAGES_BUCKET_NAME" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		if [ -n "$$EXTRA_ENV_VARS" ]; then EXTRA_ENV_VARS="$$EXTRA_ENV_VARS,"; fi; \
		EXTRA_ENV_VARS="$${EXTRA_ENV_VARS}IMAGES_BUCKET_NAME=$$IMAGES_BUCKET_NAME"; \
	else \
		echo "ℹ️  gs://$$IMAGES_BUCKET_NAME not found; deploying without IMAGES_BUCKET_NAME."; \
	fi; \
	SET_ENV_VARS_FLAG=""; \
	if [ -n "$$EXTRA_ENV_VARS" ]; then \
		SET_ENV_VARS_FLAG="--set-env-vars=$$EXTRA_ENV_VARS"; \
	fi; \
	AGENT_IDENTITY_FLAG=""; \
	if [ "$(AGENT_IDENTITY)" = "true" ] || [ "$(AGENT_IDENTITY)" = "1" ]; then \
		AGENT_IDENTITY_FLAG="--agent-identity"; \
	fi; \
	(uv export --no-hashes --no-header --no-dev --no-emit-project --no-annotate > app/app_utils/.requirements.txt 2>/dev/null || \
	uv export --no-hashes --no-header --no-dev --no-emit-project > app/app_utils/.requirements.txt) && \
	GOOGLE_CLOUD_PROJECT="$(PROJECT_ID)" \
	GOOGLE_CLOUD_PROJECT_ID="$(PROJECT_ID)" \
	uv run -m app.app_utils.deploy \
		--project="$(PROJECT_ID)" \
		--location="$(DEPLOY_REGION)" \
		--display-name="$(DEPLOY_DISPLAY_NAME)" \
		--source-packages=./app \
		--entrypoint-module=app.agent_engine_app \
		--entrypoint-object=agent_engine \
		--requirements-file=app/app_utils/.requirements.txt \
		$$SET_ENV_VARS_FLAG \
		$$SERVICE_ACCOUNT_FLAG \
		$$AGENT_IDENTITY_FLAG
# Deploy the API/websocket service to Cloud Run.
# Uses deployment_metadata.json from deploy-agent unless REMOTE_AGENT_ENGINE_ID is explicitly set.
# Usage: make deploy-api [REMOTE_AGENT_ENGINE_ID=projects/.../reasoningEngines/...] [DEPLOY_REGION=europe-west1]
deploy-api: deploy-prereqs
	@REMOTE_ID="$(REMOTE_AGENT_ENGINE_ID)"; \
	if [ -z "$$REMOTE_ID" ] && [ -f deployment_metadata.json ]; then \
		REMOTE_ID=$$(python3 -c "import json; from pathlib import Path; path=Path('deployment_metadata.json'); data=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}; print(data.get('remote_agent_engine_id', ''))"); \
	fi; \
	if [ -z "$$REMOTE_ID" ]; then \
		echo "❌ Could not determine remote Agent Engine ID."; \
		echo "Set REMOTE_AGENT_ENGINE_ID=<projects/.../reasoningEngines/...> or run 'make deploy-agent' first."; \
		exit 1; \
	fi; \
	APP_SERVICE_ACCOUNT="$(PROJECT_NAME)-app@$(PROJECT_ID).iam.gserviceaccount.com"; \
	SERVICE_ACCOUNT_FLAG=""; \
	if gcloud iam service-accounts describe "$$APP_SERVICE_ACCOUNT" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		SERVICE_ACCOUNT_FLAG="--service-account=$$APP_SERVICE_ACCOUNT"; \
	else \
		echo "ℹ️  $$APP_SERVICE_ACCOUNT not found; deploying API with default Cloud Run identity."; \
	fi; \
	LOGS_BUCKET_NAME="$(PROJECT_ID)-$(PROJECT_NAME)-logs"; \
	IMAGES_BUCKET_NAME="$(PROJECT_ID)-$(PROJECT_NAME)-images"; \
	ENV_VARS="GOOGLE_CLOUD_PROJECT=$(PROJECT_ID),GOOGLE_CLOUD_PROJECT_ID=$(PROJECT_ID),GOOGLE_CLOUD_REGION=$(DEPLOY_REGION)"; \
	if gcloud storage buckets describe "gs://$$LOGS_BUCKET_NAME" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		ENV_VARS="$$ENV_VARS,LOGS_BUCKET_NAME=$$LOGS_BUCKET_NAME"; \
	else \
		echo "ℹ️  gs://$$LOGS_BUCKET_NAME not found; deploying API without LOGS_BUCKET_NAME."; \
	fi; \
	if gcloud storage buckets describe "gs://$$IMAGES_BUCKET_NAME" --project="$(PROJECT_ID)" >/dev/null 2>&1; then \
		ENV_VARS="$$ENV_VARS,IMAGES_BUCKET_NAME=$$IMAGES_BUCKET_NAME"; \
	else \
		echo "ℹ️  gs://$$IMAGES_BUCKET_NAME not found; deploying API without IMAGES_BUCKET_NAME."; \
	fi; \
	ALLOWED_ORIGINS_VAL="$(ALLOWED_ORIGINS)"; \
	if [ -z "$$ALLOWED_ORIGINS_VAL" ]; then \
		ALLOWED_ORIGINS_VAL="https://$(PROJECT_ID).web.app"; \
		echo "ℹ️  ALLOWED_ORIGINS not set; defaulting to $$ALLOWED_ORIGINS_VAL"; \
	fi; \
	ENV_VARS="$$ENV_VARS,ALLOWED_ORIGINS=$$ALLOWED_ORIGINS_VAL"; \
	gcloud run deploy "$(API_SERVICE_NAME)" \
		--project="$(PROJECT_ID)" \
		--region="$(DEPLOY_REGION)" \
		--source="." \
		--allow-unauthenticated \
		--port="$(API_SERVICE_PORT)" \
		--cpu="$(API_CPU)" \
		--memory="$(API_MEMORY)" \
		--min-instances="$(API_MIN_INSTANCES)" \
		--max-instances="$(API_MAX_INSTANCES)" \
		--set-env-vars="$$ENV_VARS" \
		$$SERVICE_ACCOUNT_FLAG \
		--command="python" \
		--args="-m,app.app_utils.expose_app,--mode,remote,--remote-id=$$REMOTE_ID,--project-id=$(PROJECT_ID),--location=$(DEPLOY_REGION),--host,0.0.0.0,--port,$(API_SERVICE_PORT)"; \
	API_URL=$$(gcloud run services describe "$(API_SERVICE_NAME)" --project="$(PROJECT_ID)" --region="$(DEPLOY_REGION)" --format="value(status.url)"); \
	echo "✅ API deployed: $$API_URL"

# Build and deploy frontend to Firebase Hosting.
# If FRONTEND_API_BASE_URL is unset, this derives it from the deployed Cloud Run API service.
# If FRONTEND_WS_BASE_URL is unset, this derives it from FRONTEND_API_BASE_URL.
# Usage: make deploy-frontend [FRONTEND_API_BASE_URL=https://...] [FRONTEND_WS_BASE_URL=wss://...]
deploy-frontend: deploy-prereqs
	@command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"; exit 1; }; \
	API_BASE_URL="$(FRONTEND_API_BASE_URL)"; \
	if [ -z "$$API_BASE_URL" ]; then \
		API_BASE_URL=$$(gcloud run services describe "$(API_SERVICE_NAME)" --project="$(PROJECT_ID)" --region="$(DEPLOY_REGION)" --format="value(status.url)" 2>/dev/null); \
	fi; \
	if [ -z "$$API_BASE_URL" ]; then \
		echo "❌ Could not determine frontend API URL."; \
		echo "Deploy API first (make deploy-api) or set FRONTEND_API_BASE_URL explicitly."; \
		exit 1; \
	fi; \
	WS_BASE_URL="$(FRONTEND_WS_BASE_URL)"; \
	if [ -z "$$WS_BASE_URL" ]; then \
		WS_BASE_URL=$$(printf '%s' "$$API_BASE_URL" | sed -e 's#^https://#wss://#' -e 's#^http://#ws://#'); \
	fi; \
	FB_PROJECT_ID="$(VITE_FIREBASE_PROJECT_ID)"; \
	if [ -z "$$FB_PROJECT_ID" ]; then FB_PROJECT_ID="$(PROJECT_ID)"; fi; \
	FB_AUTH_DOMAIN="$(VITE_FIREBASE_AUTH_DOMAIN)"; \
	if [ -z "$$FB_AUTH_DOMAIN" ]; then FB_AUTH_DOMAIN="$(PROJECT_ID).firebaseapp.com"; fi; \
	FB_STORAGE_BUCKET="$(VITE_FIREBASE_STORAGE_BUCKET)"; \
	if [ -z "$$FB_STORAGE_BUCKET" ]; then FB_STORAGE_BUCKET="$(PROJECT_ID).appspot.com"; fi; \
	BUILD_ENV="VITE_API_BASE_URL=$$API_BASE_URL VITE_WS_BASE_URL=$$WS_BASE_URL"; \
	BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_PROJECT_ID=$$FB_PROJECT_ID"; \
	BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_AUTH_DOMAIN=$$FB_AUTH_DOMAIN"; \
	BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_STORAGE_BUCKET=$$FB_STORAGE_BUCKET"; \
	if [ -n "$(VITE_FIREBASE_API_KEY)" ]; then \
		BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_API_KEY=$(VITE_FIREBASE_API_KEY)"; \
	fi; \
	if [ -n "$(VITE_FIREBASE_MESSAGING_SENDER_ID)" ]; then \
		BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$(VITE_FIREBASE_MESSAGING_SENDER_ID)"; \
	fi; \
	if [ -n "$(VITE_FIREBASE_APP_ID)" ]; then \
		BUILD_ENV="$$BUILD_ENV VITE_FIREBASE_APP_ID=$(VITE_FIREBASE_APP_ID)"; \
	fi; \
	(cd frontend && $$BUILD_ENV npm run build); \
	firebase deploy --only hosting --project "$(PROJECT_ID)"; \
	echo "✅ Frontend deployed with API_BASE=$$API_BASE_URL and WS_BASE=$$WS_BASE_URL"

# Deploy full stack (agent engine + API service + frontend hosting).
deploy: deploy-agent deploy-api deploy-frontend

# Backward-compatible alias for backend deploy.
backend: deploy-agent

# ==============================================================================
# Infrastructure Setup
# ==============================================================================

# Set up development environment resources using Terraform.
# Respects PROJECT_ID env var, otherwise falls back to gcloud config.
setup-dev-env:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "❌ PROJECT_ID is not set."; \
		echo "   export PROJECT_ID=<your-project-id>"; \
		exit 1; \
	fi; \
	echo "Provisioning infrastructure for project: $(PROJECT_ID)"; \
	cd deployment/terraform/dev && \
	terraform init && \
	terraform apply --var-file vars/env.tfvars --var dev_project_id=$(PROJECT_ID) --auto-approve

# ==============================================================================
# Testing & Code Quality
# ==============================================================================

# Run unit and integration tests
# Unit tests run without the emulator (emulator-requiring tests are skipped).
# Integration tests require the Firestore emulator — start it first:
#   make emulator          (in a separate terminal)
# Then run the full suite:
#   FIRESTORE_EMULATOR_HOST=localhost:8080 GOOGLE_CLOUD_PROJECT=demo-test make test
test:
	uv sync --dev
	uv run pytest tests/unit && uv run pytest tests/integration

# Run code quality checks (codespell, ruff, ty)
lint:
	uv sync --dev --extra lint
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run ty check .

# ==============================================================================
# Gemini Enterprise Integration
# ==============================================================================

# Register the deployed agent to Gemini Enterprise
# Usage: make register-gemini-enterprise (interactive - will prompt for required details)
# For non-interactive use, set env vars: ID or GEMINI_ENTERPRISE_APP_ID (full GE resource name)
# Optional env vars: GEMINI_DISPLAY_NAME, GEMINI_DESCRIPTION, GEMINI_TOOL_DESCRIPTION, AGENT_ENGINE_ID
register-gemini-enterprise:
	@uvx agent-starter-pack@0.33.2 register-gemini-enterprise