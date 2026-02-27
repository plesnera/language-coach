FROM warpdotdev/dev-base:latest

# Install uv (Python package manager)
RUN curl -LsSf https://astral.sh/uv/0.8.13/install.sh | sh

ENV PATH="/root/.local/bin:$PATH"
