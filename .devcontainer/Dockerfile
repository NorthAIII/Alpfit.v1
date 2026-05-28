# Web full-stack dev container — Node 22 LTS
# Pre-built MS image: includes node + npm + yarn + non-root 'node' user

FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Modern package managers (pnpm via corepack which ships with Node 22)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Helpful CLI tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    redis-tools \
    httpie \
    jq \
    && rm -rf /var/lib/apt/lists/*

USER node
