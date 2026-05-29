# syntax=docker/dockerfile:1.7
#
# Alpfit backend — multi-stage build for staging/production.
# Build context: repo root (monorepo). From repo root:
#   docker build -f backend/Dockerfile -t alpfit-backend:local .
#
# Stages:
#   - builder: install full workspace deps, build shared + backend, prisma generate,
#              prune to production tree via `pnpm deploy`
#   - runner:  minimal slim image + dumb-init + non-root user + pruned tree

# ─── builder ──────────────────────────────────────────────────────────────
FROM node:22-bookworm AS builder

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /repo

# Workspace + lockfile + base tsconfig (cache layer for deps)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Package manifests only (pnpm install requires all workspace package.json files)
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY mobile/package.json mobile/

# Install all workspace deps (frozen lockfile = no surprise upgrades)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Source code — only shared + backend (mobile not needed for backend image)
COPY shared/ shared/
COPY backend/ backend/

# Build pipeline: shared dist → prisma client → backend dist
RUN pnpm -F @alpfit/shared build \
    && pnpm -F @alpfit/backend db:generate \
    && pnpm -F @alpfit/backend build

# Prune to production tree (workspace deps inlined as real dirs in node_modules)
RUN pnpm deploy --filter=@alpfit/backend --prod --legacy /prod

# Defensive: ensure build outputs land in pruned tree even if `files` field changes
RUN cp -r /repo/backend/dist /prod/dist \
    && mkdir -p /prod/src \
    && cp -r /repo/backend/src/generated /prod/src/generated \
    && cp -r /repo/backend/prisma /prod/prisma \
    && cp /repo/backend/prisma.config.ts /prod/prisma.config.ts

# ─── runner ───────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

# dumb-init: clean PID 1 (signal handling for docker stop / orchestrators)
# openssl + ca-certificates: Prisma engine binary + TLS to Postgres/Redis
RUN apt-get update && apt-get install -y --no-install-recommends \
        dumb-init \
        openssl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root user (uid/gid 1001 — avoid collision with node:1000)
RUN groupadd --system --gid 1001 alpfit \
    && useradd --system --uid 1001 --gid alpfit --home-dir /app --shell /sbin/nologin alpfit

WORKDIR /app

# Pruned production tree from builder (chown ownership in same layer)
COPY --from=builder --chown=alpfit:alpfit /prod ./

USER alpfit

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
