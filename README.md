# Web Full-Stack Dev Container

Node 22 LTS + Postgres 17 + Redis 7 — full-stack web app geliştirme için hazır multi-service environment.

## İçindekiler

**App container** (`mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`):
- Node 22 LTS + npm + yarn + **pnpm** (corepack ile)
- TypeScript
- CLI araçları: `psql`, `redis-cli`, `httpie`, `jq`
- Non-root user: `node` (sudo'lu)

**Servisler** (docker-compose):
- **Postgres 17** (alpine) — kullanıcı/şifre/db: `dev`/`dev`/`dev`, port 5432
- **Redis 7** (alpine) — port 6379

**Veri kalıcılığı**: postgres-data, redis-data named volumes (container restart'ta veriler korunur)

**Cache mount**: node_modules ve pnpm store named volume (rebuild'lerde paketler tekrar inmesin)

**Auto-forward portlar**: 3000 (Next/Express), 5173 (Vite), 8080 (API), 5432 (pg), 6379 (redis)

**VS Code extensions**: ESLint, Prettier, Tailwind CSS, Docker, GitLens, YAML, TOML

## Kullanım

1. Projene kopyala:
   ```bash
   cp -r ~/dev-setup/templates/web-fullstack/.devcontainer /path/to/your/project/
   ```
2. (Opsiyonel) `package.json` ekle — post-create otomatik `pnpm install` çalıştırır
3. VS Code'da `F1` → "Dev Containers: Reopen in Container"
4. İlk build ~2-3 dk (Node image + servisler indirilecek)

## Bağlantı bilgileri (container içinden uygulamanın kullanacağı)

```env
DATABASE_URL=postgres://dev:dev@postgres:5432/dev
REDIS_URL=redis://redis:6379
```

Bu env vars otomatik set ediliyor (devcontainer.json + docker-compose.yml). Uygulamanda direkt `process.env.DATABASE_URL` kullanabilirsin.

## Servislere host'tan erişim

Port forwarding sayesinde host browser/CLI'dan:
- `psql postgres://dev:dev@localhost:5432/dev`
- `redis-cli -h localhost -p 6379`

## Özelleştirme

- **Node sürümü**: `Dockerfile` → `FROM mcr.microsoft.com/devcontainers/typescript-node:1-XX-bookworm`
- **Postgres sürümü**: `docker-compose.yml` → `image: postgres:VERSION-alpine`
- **Ek servis** (örn. MeiliSearch, Minio): `docker-compose.yml` → yeni `service` bloğu ekle, `depends_on`'a ekle
- **Ek extension**: `devcontainer.json` → `customizations.vscode.extensions`

## Smoke test

Container açıldıktan sonra container içinde:
```bash
pg_isready -h postgres -U dev  # accepting connections
redis-cli -h redis ping        # PONG
node --version                  # v22.x
pnpm --version                  # 11.x
```
