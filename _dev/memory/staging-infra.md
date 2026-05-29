# Staging Altyapısı — Hetzner CPX32 (paylaşımlı VPS)

> Alpfit staging deploy ortamının operasyonel sabit verileri. Sırlar burada **yazılmaz** (sadece anahtar/değişken isimleri). Detaylı kurulum + rehber için [_dev/docs/hetzner-staging-setup.md](../docs/hetzner-staging-setup.md). Mimari kararı için DECISIONS.md 2026-05-29 "TASK-1.10 Staging Deploy".

## Sunucu

- **Sağlayıcı:** Hetzner Cloud (Nuremberg — AB, KVKK m.9 için savunulabilir)
- **Tip:** CPX32 (4 vCPU, 8 GB RAM, 160 GB disk)
- **IP:** `178.104.140.36`
- **Hostname:** `bunker` (Hetzner project: "Bunker Os")
- **OS:** Ubuntu (24.04)
- **Swap:** 2 GB (`/swapfile`, `vm.swappiness=10`)
- **Paylaşımlı:** **Bunker projesi** (`ops.kiwiailab.com`) aynı sunucuda; 11 Docker container (nginx:alpine, Next.js dashboard, n8n, postgres:15, redis, qdrant, ollama, adminer, umami). Bunker'a dokunulmaz; alpfit-backend bunker docker network'üne external attach.

## Alpfit Staging Yapısı

- **Subdomain:** `alpfit-staging.kiwiailab.com` (Squarespace DNS A record)
- **Reverse proxy:** Bunker'ın `bunker-nginx:alpine` container'ı — yeni server block ile `alpfit-staging.kiwiailab.com` → `alpfit-backend:3000` proxy_pass
- **SSL:** Let's Encrypt (certbot — Bunker setup'ı ile aynı yöntem)
- **Repo yolu:** `/opt/alpfit/` (deploy user sahip)
- **Compose dosyası:** `/opt/alpfit/_ops/staging/docker-compose.yml`
- **Env dosyası:** `/opt/alpfit/_ops/staging/.env.staging` (chmod 600, owner deploy:deploy)
- **Container'lar:**
  - `alpfit-backend` (Node 22 + Fastify, port 3000 internal)
  - `alpfit-postgres` (postgres:17-alpine, named volume `alpfit-pgdata`, port expose YOK)
  - `alpfit-redis` (redis:7-alpine, named volume `alpfit-redisdata`, port expose YOK)
- **Network'ler:** `alpfit-net` (internal) + `bunker_default` (external, bunker-nginx erişimi için)

## SSH Erişimi

- **Root:** `ssh root@178.104.140.36` (key-only, kullanıcı laptop'unda `~/.ssh/id_ed25519`)
- **Deploy user:** `ssh deploy@178.104.140.36` (docker group üyesi, sudo YOK, GitHub Actions buraya bağlanır)
- **Sunucuda key:** `/home/deploy/.ssh/github_actions_deploy` (ed25519, passphrase YOK; public key authorized_keys'te)

## GitHub Secrets (Actions için)

> Sadece **isim** — değer asla burada yazılmaz; GitHub repo Settings → Secrets and variables → Actions.

| Secret | Anlamı |
|--------|--------|
| `STAGING_SSH_HOST` | `178.104.140.36` |
| `STAGING_SSH_USER` | `deploy` |
| `STAGING_SSH_KEY` | Sunucudaki `/home/deploy/.ssh/github_actions_deploy` private key içeriği |

## Backend Env Değişkenleri

> Değerler **`/opt/alpfit/_ops/staging/.env.staging`**'de — repo'da `_ops/staging/.env.staging.example` template'i.

| Değişken | Kaynak |
|----------|--------|
| `NODE_ENV` | `staging` |
| `APP_ENV` | `staging-tr` |
| `PORT` | `3000` |
| `LOG_LEVEL` | `info` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | docker-compose `alpfit-postgres` ile aynı |
| `DATABASE_URL` | `postgresql://alpfit:<password>@alpfit-postgres:5432/alpfit` |
| `REDIS_URL` | `redis://alpfit-redis:6379` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `openssl rand -hex 32` ile üretilir (32+ char) |

## Deploy Akışı (özet)

1. main'e push → CI yeşil
2. GitHub Actions `Deploy Staging` workflow tetiklenir (`workflow_run`)
3. SSH ile `deploy@178.104.140.36`
4. `cd /opt/alpfit && git reset --hard <sha>`
5. `cd _ops/staging && docker compose build alpfit-backend && up -d`
6. `docker compose exec alpfit-backend node_modules/.bin/prisma migrate deploy`
7. Internal healthz smoke (5× retry)

## Yedekleme

- **Bunker tarafı:** Bunker projesinin kendi yedek stratejisi (bu repoya ait değil)
- **Alpfit tarafı:** TASK-1.16'da Backblaze B2 off-site (Coolify built-in yok; `pg_dump` cron + rclone)
- **Hetzner snapshot:** Manuel — kritik değişiklik öncesi (`hcloud server create-image --type snapshot`)

## İzleme Eşikleri

- **Disk:** `/` %85'i geçerse alarm. Şu an %77 dolu (Bunker veri ağırlıklı). `docker system prune -af` periyodik.
- **RAM:** 8 GB toplam → Bunker ~2.5 GB + Alpfit ~1.5 GB = ~4 GB tipik. Swap aktifse OOM yaklaşıyor.
- **SSL:** Let's Encrypt cert 90 gün; certbot auto-renew Bunker setup'ı ile aynı (cron veya systemd timer).

## TODO

- [ ] **KVKK SCC imzası** (Yakın 4 öncesi) — Hetzner Cloud Standart Sözleşme, hukuki danışman onayı. `_dev/KVKK.md`'de TODO satırı.
- [ ] **Backblaze B2 off-site yedek** (TASK-1.16) — `pg_dump` + rclone cron, restore drill.
- [ ] **Sentry DSN** (TASK-1.11/1.12) — `.env.staging`'e ek değişken, source map upload deploy workflow'una.
- [ ] **Prod ortam** (Yakın 5 öncesi) — Ayrı sunucu mı, ortak mı, prd-review'da karar.
