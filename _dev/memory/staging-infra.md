# Staging Altyapısı — Hetzner CPX32 (paylaşımlı VPS)

> Alpfit staging deploy ortamının operasyonel sabit verileri. Sırlar burada **yazılmaz** (sadece anahtar/değişken isimleri). Detaylı kurulum + rehber için [_dev/docs/hetzner-staging-setup.md](../docs/hetzner-staging-setup.md). Mimari kararı için DECISIONS.md 2026-05-29 "TASK-1.10 Staging Deploy".

## Sunucu

- **Sağlayıcı:** Hetzner Cloud (Nuremberg — AB, KVKK m.9 için savunulabilir)
- **Tip:** CPX32 (4 vCPU, 8 GB RAM, 160 GB disk)
- **IP:** `178.104.140.36`
- **Hostname:** `bunker` (Hetzner project: "Bunker Os")
- **OS:** Ubuntu (24.04)
- **Swap:** 4 GB (`/swapfile`, `vm.swappiness=10`, fstab persistent — ollama + n8n RAM spike için 4 GB seçildi)
- **Paylaşımlı:** **Bunker projesi** (`ops.kiwiailab.com`) aynı sunucuda; 11 Docker container (nginx:alpine, Next.js dashboard, n8n, postgres:15, redis, qdrant, ollama, adminer, umami). Bunker'a dokunulmaz; alpfit-backend bunker docker network'üne external attach.

## Alpfit Staging Yapısı

- **Subdomain:** `alpfit-staging.kiwiailab.com` (Squarespace DNS A record → `178.104.140.36`)
- **Reverse proxy:** Bunker'ın `bunker-nginx:alpine` container'ı — `nginx.conf` host bind mount (`/opt/bunker/nginx/nginx.conf`), conf.d **kullanılmıyor**; HTTP :80 regex wildcard `~^[a-z0-9-]+\.kiwiailab\.com$` ACME challenge için zaten yakalıyor (yeni HTTP server block GEREKMEZ); HTTPS :443'te catch-all regex bunker_dashboard'a yönlendiriyor — yeni subdomain için **exact-match server block ŞART** (nginx exact > regex precedence) ve regex'ten **ÖNCE** eklenir. Alpfit için `alpfit-staging.kiwiailab.com` exact-match 443 server block → `proxy_pass http://alpfit-backend:3000`. Config değişikliği öncesi `nginx.conf.bak.<sha>` yedek + `nginx -t` zorunlu.
- **SSL — SAN cert paterni (kritik):** Tüm Bunker domain'leri **tek SAN cert** altında, ana cert adı `n8n.kiwiailab.com` (`/etc/letsencrypt/live/n8n.kiwiailab.com/`). Yeni subdomain eklerken: `certbot certonly --webroot -w /opt/bunker/certbot-webroot --expand --cert-name n8n.kiwiailab.com --key-type ecdsa -d <mevcut-1> -d <mevcut-2> ... -d <yeni>` — mevcut domain'leri `-d` ile **tek tek geçirmek ŞART**, aksi takdirde cert prune olur. Deploy-hook (`/etc/letsencrypt/renewal-hooks/deploy/copy-to-nginx.sh`) cert renewal sonrası otomatik `/opt/bunker/nginx/ssl/` mount'a kopyalar; certbot.timer aktif (systemd auto-renewal). 7-domain SAN cert şu an: limoncloud + munar + n8n + ops + reverb-demo + umami + alpfit-staging (2026-08-27'ye kadar).
- **Repo yolu:** `/opt/alpfit/` (deploy user sahip)
- **Compose dosyası:** `/opt/alpfit/_ops/staging/docker-compose.yml`
- **Env dosyası:** `/opt/alpfit/_ops/staging/.env.staging` (chmod 600, owner deploy:deploy)
- **Container'lar:**
  - `alpfit-backend` (Node 22 + Fastify, port 3000 internal)
  - `alpfit-postgres` (postgres:17-alpine, named volume `alpfit-pgdata`, port expose YOK)
  - `alpfit-redis` (redis:7-alpine, named volume `alpfit-redisdata`, port expose YOK)
- **Network'ler:** `alpfit-net` (internal) + **`bunker-network`** (external, bunker-nginx erişimi için — `bunker_default` DEĞİL; ilk plan bu varsayımla yazılmıştı, sunucu keşfinde gerçek isim doğrulandı: `docker network ls --filter name=bunker`)

## SSH Erişimi

- **Root:** `ssh root@178.104.140.36` (key-only, kullanıcı laptop'unda `~/.ssh/id_ed25519`)
- **Deploy user:** `ssh deploy@178.104.140.36` (docker group üyesi, sudo YOK, GitHub Actions buraya bağlanır)
- **Sunucuda GH Actions key:** `/home/deploy/.ssh/github_actions_ssh` (ed25519, passphrase YOK; public key `authorized_keys`'te)
- **Sunucuda GitHub repo deploy key:** `/home/deploy/.ssh/github_repo_deploy` (ed25519; public key GitHub repo Deploy Keys'te `alpfit-staging-server` adıyla read-only; SSH config `Host github.com` bu key'i kullanır + known_hosts populated)

## GitHub Secrets (Actions için)

> Sadece **isim** — değer asla burada yazılmaz; GitHub repo Settings → Secrets and variables → Actions.

| Secret | Anlamı |
|--------|--------|
| `STAGING_SSH_HOST` | `178.104.140.36` |
| `STAGING_SSH_USER` | `deploy` |
| `STAGING_SSH_KEY` | Sunucudaki `/home/deploy/.ssh/github_actions_ssh` private key içeriği |

**Yazım kuralı — `gh secret set < file` (UI YERİNE):** GitHub UI'dan secret yapıştırma multi-line key'lerde **trailing newline** veya **whitespace bozulması** üretiyor (`ssh.ParsePrivateKey: no key found` + DNS lookup hatası gözlemlendi). Daima `printf '%s' "$value" > /tmp/secret_file && gh secret set NAME < /tmp/secret_file` (stdin redirect) veya `gh secret set NAME --body "<value>"` (tek satırlık değerler için) kullan. Multi-line private key'lerde özellikle dikkat: `cat key.pem | gh secret set STAGING_SSH_KEY` da geçerlidir. UI'dan yapıştırılan secret'ı `gh secret list` ile boyut kontrol et (beklenen byte ≈ dosya boyutu).

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
- **SSL:** Let's Encrypt SAN cert 90 gün (ana ad `n8n.kiwiailab.com`, 7 domain dahil); certbot.timer systemd auto-renewal + deploy-hook nginx mount kopyala. Mevcut cert son: 2026-08-27.

## Repo Tuzakları (Bu task'tan çıkanlar)

- **`.gitignore` `.env.*` kuralı template'leri yutar:** `.env.*` deseni `.env.staging.example` template'ini de yakalıyor (`.env.example` istisnası varsayılan, çoklu env'i kapsamıyor). Çözüm: `!.env.*.example` istisnası ekle. Test: `git check-ignore -v _ops/staging/.env.staging.example` → ignore EDİLMEMELİ.
- **Adım kanıtı disiplini:** "Adım tamam ✅" işaretlemeden önce komutun exit code'una **değil**, **log + sonuç hedeflenen değişikliği kanıtlıyor mu**'ya bak. Örnekler: GH Actions deploy run "8s" gözükmesi SSH auth'ın çalıştığı anlamına gelmez (oturum #2'nin yanlış teşhisi — gerçekte `ssh.ParsePrivateKey` ile early-fail oluyordu); GitHub Deploy Key "UI'da eklendi sanmak" — gerçekte eklenmemişti, `git clone` deny verince fark edildi. Workaround: secret'ı yazdıktan sonra `gh secret list` byte boyutu + `workflow_dispatch` ile manual smoke + log oku.
- **`prisma migrate deploy` runner image'da `pnpm` YOK:** Multi-stage Dockerfile'da runner katmanı sadece production deps (pnpm deploy ile prune) — `pnpm prisma migrate deploy` çalışmaz. Çözüm: `./node_modules/.bin/prisma migrate deploy` (shell script, `node` olmadan doğrudan çağrı). `docker compose exec` ile çalıştırılır.

## TODO

- [ ] **KVKK SCC imzası** (Yakın 4 öncesi) — Hetzner Cloud Standart Sözleşme, hukuki danışman onayı. `_dev/KVKK.md`'de TODO satırı.
- [ ] **Backblaze B2 off-site yedek** (TASK-1.16) — `pg_dump` + rclone cron, restore drill.
- [ ] **Sentry DSN** (TASK-1.11/1.12) — `.env.staging`'e ek değişken, source map upload deploy workflow'una.
- [ ] **Prod ortam** (Yakın 5 öncesi) — Ayrı sunucu mı, ortak mı, prd-review'da karar.
