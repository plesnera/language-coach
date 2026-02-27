# Language Coach

This document provides essential context about the "language-coach" application for the Gemini Code Assistant. It outlines the project's structure, technologies, and key operational commands to help the assistant understand and interact with the codebase effectively.

## 1. Project Overview

**language-coach** is a real-time voice and video agent designed to act as a language coach. It is built using the "Agent Starter Pack" framework. The application consists of a Python backend that handles the agent logic and a React-based frontend for the user interface.

- **Backend**: Python using FastAPI, part of the Google Agent Development Kit (ADK).
- **Frontend**: React with TypeScript, Vite for the build system.
- **Infrastructure**: Managed by Terraform, with CI/CD pipelines using Google Cloud Build.

## 2. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, `google-adk`, `uv` for package management.
- **Frontend**: Node.js, React, TypeScript, Vite, SASS.
- **Testing**: `pytest` for the backend, `vitest` and React Testing Library for the frontend.
- **Linting/Formatting**: `ruff`, `codespell`, `ty` for Python.
- **Deployment**: Google Cloud Build, Google Cloud Agent Engine, Terraform.

## 3. Project Structure

The project is organized as follows:

```
language-coach/
├── app/                  # Core Python agent code
│   ├── agent.py          # Main agent logic
│   ├── agent_engine_app.py # Agent Engine application wrapper
│   └── app_utils/        # Utilities for deployment and local execution
├── .cloudbuild/          # CI/CD pipeline configurations for Google Cloud Build
├── deployment/           # Infrastructure as Code (Terraform)
│   └── terraform/
├── frontend/             # React frontend application
│   ├── src/              # Frontend source code
│   ├── package.json      # Frontend dependencies and scripts
│   └── vite.config.ts    # Vite configuration
├── tests/                # Backend tests (unit, integration)
├── Makefile              # Centralized development and deployment commands
├── pyproject.toml        # Backend Python dependencies (for uv)
└── uv.lock               # Lockfile for Python dependencies
```

## 4. Key Files

- `app/agent.py`: The primary location for the core agent's business logic.
- `app/agent_engine_app.py`: The FastAPI application that serves the agent.
- `frontend/src/App.tsx`: The main React component for the user interface.
- `Makefile`: Contains all essential commands for development, testing, and deployment.
- `pyproject.toml`: Defines backend dependencies for `uv`.
- `frontend/package.json`: Defines frontend dependencies and scripts for `npm`.
- `deployment/terraform/`: Contains all Terraform files for the project's infrastructure.
- `.cloudbuild/*.yaml`: Defines the CI/CD steps for different environments (PR checks, staging, prod).

## 5. Development Workflow

The `Makefile` is the primary entry point for all development tasks.

### Setup

To install all backend and frontend dependencies, run:
```bash
make install
```

### Running Locally

There are several ways to run the application locally:

1.  **Playground Mode**: Serves the pre-built frontend with the Python backend. This is the quickest way to see the application running. The backend will **not** hot-reload.
    ```bash
    make playground
    ```
    Access it at `http://localhost:8000`.

2.  **Development Mode (Hot-Reload)**: Runs the backend and frontend dev servers separately, with hot-reloading enabled for both. This is the recommended mode for active development.
    ```bash
    make playground-dev
    ```
    -   Frontend is available at `http://localhost:8501`.
    -   Backend is available at `http://localhost:8000`.

3.  **Run UI Separately**: If you only need to work on the frontend.
    ```bash
    make ui
    ```

### Testing

-   **Backend Tests**: Run Python unit and integration tests using `pytest`.
    ```bash
    make test
    ```

-   **Frontend Tests**: Run frontend tests using `vitest`.
    ```bash
    cd frontend
    npm test
    ```

### Linting & Formatting

-   **Backend**: Run `ruff` to lint and format the Python code.
    ```bash
    make lint
    ```

## 6. Deployment

The application is deployed to Google Cloud's Agent Engine.

-   **Set Project**: Ensure your gcloud CLI is configured with the correct project.
    ```bash
    gcloud config set project <your-project-id>
    ```

-   **Deploy Agent**: The `deploy` command handles packaging the application and deploying it.
    ```bash
    make deploy
    ```

The deployment process is automated via Google Cloud Build, as defined in the `.cloudbuild/` directory.
Infrastructure is provisioned using Terraform files located in `deployment/terraform/`.
