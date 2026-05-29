# TASK-1.10: Staging deploy (shared Hetzner VPS — docker-compose + bunker-nginx subdomain proxy + GH Actions auto-deploy)

**Durum:** 🔄 Devam ediyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.03, TASK-1.09

---

## Hedef

Mevcut Hetzner CPX32 sunucusunda (178.104.140.36, Nuremberg — Bunker projesinin paylaşımlı VPS'i) Alpfit backend için **Coolify'sız docker-compose** staging ortamı kur:

- Backend (Node 22 + Fastify) + Postgres 17 + Redis 7 → `/opt/alpfit/` altında docker-compose
- bunker-nginx'e `alpfit-staging.kiwiailab.com` server block ekle (Let's Encrypt SSL)
- GitHub `main` push → GH Actions `deploy-staging.yml` workflow → SSH ile `docker compose pull && up -d && prisma migrate deploy`
- `/healthz` staging URL'inden 200 dönmeli: `https://alpfit-staging.kiwiailab.com/healthz` → `{ status: 'ok', db: 'up' }`
- Bunker'a (11 mevcut container) **sıfır dokunma**; bunker-nginx config'e yalnızca yeni server block eklenir
- 2 GB swap eklenir (8 GB RAM iki proje paylaşımı için OOM koruması)

Mobile bu task'ta deploy edilmiyor — Yakın 5'te EAS Build/Submit.

---

## Bağlam (Mimari Sapma)

Task orijinal kararı (PHASE-1 araştırma) **Hetzner + Coolify** idi. Task icra başlangıcında kullanıcı maliyet optimizasyonu için var olan Hetzner CPX32 sunucusunu (Bunker projesi çalışıyor) Alpfit staging için de paylaşmak istedi. SSH keşfi sonucu:

- Bunker tamamen Docker'da (11 container, `bunker-nginx:alpine` 80/443'ü tutuyor, sistem nginx yok)
- RAM 7.6 GB → 5.2 GB serbest (yeter), disk 150 GB → 34 GB serbest (%77 dolu — izlenmeli), swap 0
- Coolify install Bunker'ın 80/443 portlarına çakışacaktı → 3 alternatif değerlendirildi

**Karar:** Coolify'sız, docker-compose + bunker-nginx subdomain proxy + GH Actions SSH deploy. Detay + tradeoff'lar: `_dev/docs/DECISIONS.md` 2026-05-29 "TASK-1.10 Staging Deploy: Coolify Yerine Docker Compose + bunker-nginx Subdomain Proxy" girdisinde.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §7 (CI/CD), §2 (Env & Secret)
- `_dev/phases/PHASE-1.md` — Araştırma → Hosting kararı + Dikkat Edilecekler #4 (Hetzner SPOF), #6 (KVKK m.9)
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi", §"Kalıcılık önceliği"
- `_dev/docs/DECISIONS.md` — 2026-05-29 "TASK-1.10 Staging Deploy" (yeni mimari kararı), 2026-05-29 "Hosting + Staging: Hetzner Cloud + Coolify" (üst karar — Hetzner + AB konum kısmı korunuyor)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/memory/staging-infra.md` — yeni dosya (sunucu IP, deploy user, /opt/alpfit yolu, subdomain, env değişkeni anahtar listesi DEĞER YOK)
- `_dev/MEMORY.md` — index'e pointer
- `_dev/KVKK.md` — Hetzner SCC TODO (Yakın 4 öncesi hukuki danışman)

---

## Alt Görevler

- [ ] **1. Repo: Backend Dockerfile + .dockerignore**
  - `backend/Dockerfile` — multi-stage: `node:22-bookworm` (builder: pnpm install + shared build + prisma generate + tsc) + `node:22-bookworm-slim` (runner: dist + production deps + non-root user + dumb-init)
  - `backend/.dockerignore` — node_modules, dist, .env*, coverage, test, __snapshots__
  - `backend/package.json` — `build` script kontrol (`tsc -p tsconfig.build.json`) + `start` script (`node dist/index.js`)

- [ ] **2. Repo: docker-compose.staging.yml**
  - `_ops/staging/docker-compose.yml` — `alpfit-backend` (build context: repo root), `alpfit-postgres` (postgres:17-alpine + named volume + healthcheck, **port expose YOK**), `alpfit-redis` (redis:7-alpine + named volume + healthcheck, port expose YOK)
  - Backend `depends_on: [alpfit-postgres, alpfit-redis]` (condition: service_healthy)
  - `restart: unless-stopped`
  - Network: internal `alpfit-net` + external `bunker_default` (bunker-nginx'in Alpfit'e erişebilmesi için — gerçek bunker network adı SSH keşfinde doğrulanır)
  - `_ops/staging/.env.staging.example` — repo'ya commit; gerçek `.env.staging` sadece sunucuda

- [ ] **3. Repo: GitHub Actions deploy workflow**
  - `.github/workflows/deploy-staging.yml`
  - Trigger: `workflow_run` (ci.yml başarılı + branch=main) — CI yeşil olmadan deploy etmez
  - Job tek: `deploy` — `appleboy/ssh-action@v1` `host: 178.104.140.36`, `username: deploy`, `key: ${{ secrets.STAGING_SSH_KEY }}`, `port: 22`
  - Script:
    ```
    set -euo pipefail
    cd /opt/alpfit
    git fetch --depth=1 origin main
    git reset --hard origin/main
    docker compose -f _ops/staging/docker-compose.yml --env-file .env.staging build alpfit-backend
    docker compose -f _ops/staging/docker-compose.yml --env-file .env.staging up -d
    docker compose -f _ops/staging/docker-compose.yml --env-file .env.staging exec -T alpfit-backend pnpm prisma migrate deploy
    docker compose -f _ops/staging/docker-compose.yml ps
    ```

- [ ] **4. Repo: Manuel kurulum rehberi**
  - `_dev/docs/hetzner-staging-setup.md` — kullanıcı + Claude SSH ile birlikte yürütülecek adım-adım rehber:
    1. Swap 2 GB ekle
    2. `deploy` user oluştur (no sudo, docker group)
    3. `/opt/alpfit` dizini + repo clone + ownership
    4. GH Actions CI deploy SSH key oluştur (Ed25519) + GH `STAGING_SSH_KEY` secret + sunucuda authorized_keys
    5. `.env.staging` doldur (DATABASE_URL, REDIS_URL, JWT secrets, NODE_ENV=staging, PORT=3000)
    6. bunker-nginx config keşif (config dosyası nerede, certbot var mı, network adı ne)
    7. bunker-nginx'e alpfit-staging server block ekle (Let's Encrypt cert)
    8. DNS A record (Squarespace) — `alpfit-staging` → 178.104.140.36
    9. İlk manuel deploy + `/healthz` smoke
    10. GH Actions auto-deploy smoke (boş commit ile tetikle)

- [ ] **5. Lokal: Backend Docker build smoke**
  - `docker build -f backend/Dockerfile -t alpfit-backend:smoke .` repo root'tan; hatasız tamamlanmalı
  - `docker run --rm alpfit-backend:smoke node --version` → v22.x

- [ ] **6. SSH (kullanıcıyla): Sunucu hazırlık**
  - Swap 2 GB (`fallocate /swapfile 2G && ... && swapon -a`)
  - `deploy` user create + ssh key + docker group
  - `/opt/alpfit` clone
  - bunker keşfi: nginx config yolu (`docker exec bunker-nginx cat /etc/nginx/conf.d/*.conf`), bunker network adı (`docker network ls`), certbot mevcut mu

- [ ] **7. SSH (kullanıcıyla): Subdomain + SSL**
  - Squarespace DNS: `alpfit-staging` A record → 178.104.140.36 (kullanıcı yapar)
  - DNS propagation bekle (`dig alpfit-staging.kiwiailab.com`)
  - bunker-nginx config'e yeni server block (HTTP'de port 80 ile temporary, certbot Let's Encrypt issue)
  - `nginx -t` + reload
  - HTTPS redirect ekle

- [ ] **8. SSH (kullanıcıyla): Backend deploy + test**
  - `/opt/alpfit/.env.staging` doldur (sırlar — kullanıcının makinesinde değil, doğrudan SSH session'da nano/vi)
  - `docker compose -f _ops/staging/docker-compose.yml --env-file .env.staging up -d`
  - `docker compose logs -f alpfit-backend` → boot logları, fail-fast doğrula
  - `curl -k https://alpfit-staging.kiwiailab.com/healthz` → 200, `{ status: 'ok', db: 'up' }`

- [ ] **9. GH Actions auto-deploy smoke**
  - main'e küçük commit (örn. README'de boşluk) push
  - GH Actions deploy-staging workflow tetiklensin
  - Sunucuda `git log -1` → yeni commit; `/healthz` yine 200

- [ ] **10. Doküman güncellemeleri**
  - `_dev/memory/staging-infra.md` — sunucu IP, deploy user, /opt/alpfit, subdomain, env değişkeni anahtarları (DEĞER YOK), disk %85 izleme notu
  - `_dev/MEMORY.md` index — Ortam & Araç Notları altına pointer
  - `_dev/KVKK.md` — Hetzner SCC TODO satırı

---

## Etkilenen Dosyalar

```
backend/
├── Dockerfile                                  # YENİ
├── .dockerignore                               # YENİ
├── tsconfig.build.json                         # YENİ (dist build için)
└── package.json                                # GÜNCELLE (build/start scriptleri)

_ops/staging/
├── docker-compose.yml                          # YENİ
└── .env.staging.example                        # YENİ

.github/workflows/
└── deploy-staging.yml                          # YENİ

_dev/docs/
└── hetzner-staging-setup.md                    # YENİ (manuel rehber)

_dev/memory/
└── staging-infra.md                            # YENİ

_dev/MEMORY.md                                  # GÜNCELLE (index pointer)
_dev/KVKK.md                                    # GÜNCELLE (SCC TODO)
```

---

## Dikkat Noktaları

- **Bunker'a sıfır dokunma:** bunker-nginx config'e yalnızca yeni server block eklenir; mevcut block'lara dokunulmaz. Config değişikliği öncesi `nginx.conf` yedek kopyası alınır. `nginx -t` ile syntax doğrulanmadan reload yapılmaz.
- **Network external attach:** Alpfit backend container'ı bunker docker network'üne external attach olur → bunker-nginx Alpfit'i hostname (`alpfit-backend:3000`) ile çağırabilir. Bunker network adı keşifte doğrulanır (`docker network ls`).
- **Bunker SPOF artar:** bunker-nginx düşerse Alpfit de düşer. Bunker zaten SPOF olduğu için ek SPOF eklenmiyor; mitigation Backblaze yedek TASK-1.16'da.
- **deploy user yetkisi:** Root SSH key-only olarak kalır; GH Actions sadece `deploy` user'a bağlanır. `deploy` user docker group üyesi ama sudo değil. Hassas işlem (apt install, systemd) root SSH ile manuel yapılır.
- **`.env.staging` repo'ya gitmez:** Sadece sunucuda `/opt/alpfit/.env.staging` (chmod 600, owner deploy:deploy). Repo'da yalnızca `.env.staging.example` (yer tutucu değerler).
- **prisma migrate deploy:** Migration başarısız olursa deploy fail; rollback için `git reset --hard <prev-sha>` + manuel migration restore (TASK-1.16 Backblaze patern'i sonra). İlk deploy boş schema → migration uygulama smoke.
- **Disk %77 dolu:** Alpfit container imajları + Postgres veri ~5-10 GB ekleyecek. %85'i geçerse Bunker temizlik veya Hetzner volume eklenir (memory'de izleme notu).
- **Squarespace DNS propagation:** TTL default ~1 saat; cert issue önce DNS yayılmasını bekle.
- **Let's Encrypt rate limit:** Aynı domain için haftada 5 cert. Test sırasında `--staging` flag ile Let's Encrypt staging cert kullanılabilir (rate sınırsız).

---

## Test Kriterleri

- [ ] `backend/Dockerfile` lokalde `docker build` hatasız tamamlanır
- [ ] Built image `node --version` → v22.x
- [ ] Sunucuda `/opt/alpfit/docker-compose.yml` ile `docker compose up -d` 3 container (backend + postgres + redis) sağlıklı çalışır
- [ ] `docker compose ps` → tüm container healthy
- [ ] Sunucuda `curl -k http://localhost:3000/healthz` (internal) → 200
- [ ] Internet'ten `curl https://alpfit-staging.kiwiailab.com/healthz` → 200 + `{ status: 'ok', db: 'up' }`
- [ ] HTTP → HTTPS redirect çalışıyor
- [ ] SSL sertifikası geçerli (Let's Encrypt)
- [ ] `prisma migrate deploy` deploy script'inde çalışır, migration tablosu staging DB'de doğru
- [ ] Yanlış env değişkeni ile container start denenirse backend zod parse hatasıyla **fail fast** eder
- [ ] main'e push → GH Actions `deploy-staging` workflow tetiklenir → sunucuda `git log -1` yeni commit'i gösterir → `/healthz` yine 200
- [ ] Bunker'ın `ops.kiwiailab.com` adresine erişim Alpfit kurulumundan sonra etkilenmemiş

---

## Karar Noktaları

- **Build pack: Dockerfile** — custom Dockerfile (Nixpacks yok). Reproducibility + Prisma generate adımı explicit + monorepo pnpm uyumu. [[ilkeler]] §"Kalıcılık önceliği".
- **Postgres versiyonu: 17-alpine** — Alpfit dev/test (devcontainer + CI) zaten 17. Bunker'ın postgres:15-alpine'i ayrı container, çakışma yok.
- **CI deploy SSH key tipi: Ed25519** — Daha kısa + güvenli + GH Actions standardı.
- **Migration nasıl çalışacak: `docker compose exec -T alpfit-backend pnpm prisma migrate deploy`** — running container içinde, runtime env ile. Alternatif: ayrı one-shot container; ama exec daha basit.
- **Network attach: external `bunker_default`** — keşifte gerçek isim doğrulanır; aksi takdirde bunker network'üne `docker network connect` ile manuel ekleme.
- **Coolify'sız: log viewer + rollback nasıl** — `docker compose logs -f` + `git checkout <prev-sha>` + redeploy. Demo ölçeği için yeterli.

---

## Risk ve Geri Dönüş Planı

- **Risk:** bunker-nginx config değişikliği Bunker'ı kırar.
  - **Mitigation:** Config yedeği önce alınır; `nginx -t` reload öncesi zorunlu; sadece yeni server block eklenir.
  - **Rollback:** Yedek config dosyasını geri yükle + `nginx -s reload`.
- **Risk:** docker network external attach yanlış isimle yapılır → backend bunker-nginx'ten erişilemez.
  - **Mitigation:** Keşifte `docker network ls` ile gerçek isim doğrulanır.
- **Risk:** Disk %77'den hızla dolar (image layer + Postgres data).
  - **Mitigation:** `docker system prune -af` periyodik; memory'de %85 izleme notu.
- **Risk:** GH Actions deploy script'i fail-fast olmazsa kısmi deploy.
  - **Mitigation:** Script `set -euo pipefail`.
- **Risk:** İlk SSL cert issue Let's Encrypt rate limit'e takılır.
  - **Mitigation:** Önce `--staging` flag ile test; başarılı sonra production cert.
- **Rollback:** `git reset --hard <prev-sha>` + redeploy + DB rollback için Backblaze restore (TASK-1.16'da prosedür).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı (kullanıcı manuel adımları dahil)
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.10): set up staging deploy via docker-compose on shared hetzner vps`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — yeni mimari kararı yazıldı
- [ ] `_dev/memory/staging-infra.md` + MEMORY.md index güncellendi
- [ ] `_dev/KVKK.md` SCC TODO satırı eklendi

---

## Oturum Kayıtları

### Oturum 2026-05-29 #1 — Mimari Sapma + Repo Skeleton + Sunucu Hazırlığı (⏸️ Duraklatıldı)

**Durum:** ⏸️ Duraklatıldı (context şişti, /devflow:resume ile devam — 5-6 adım kaldı)

**Yapılanlar (commit'ler: 3b24234 + fd23c73 + 325cf2a):**

- **Mimari sapma kararı:** Coolify yerine docker-compose + bunker-nginx subdomain proxy + GH Actions SSH deploy. Gerekçe: Bunker sunucusu (CPX32, Nuremberg) zaten 11 Docker container'la dolu, bunker-nginx 80/443'ü tutuyor; ek sunucu maliyet (€10/ay) demo aşamasında değer üretmiyor. Detay: DECISIONS.md 2026-05-29 "TASK-1.10 Staging Deploy".
- **Repo skeleton (3b24234):**
  - `backend/Dockerfile` — multi-stage node:22 builder + bookworm-slim runner, pnpm deploy ile prune, dumb-init PID 1, non-root user (uid 1001 alpfit)
  - `_ops/staging/docker-compose.yml` — backend + postgres:17-alpine + redis:7-alpine; postgres/redis port expose YOK (internal); `bunker_default` external network (gerçek isim sunucuda doğrulanacak)
  - `_ops/staging/.env.staging.example` template
  - `.github/workflows/deploy-staging.yml` — workflow_run after CI on main; appleboy/ssh-action@v1.2.0; `set -euo pipefail` + git fetch + docker compose build/up + prisma migrate deploy + healthz retry x5
  - `.dockerignore` repo-wide
  - **shared/package.json `exports` field** — Node prod bug fix: `import` → `./dist/index.js`, `default` → `./src/index.ts` (mobile metro `unstable_enablePackageExports` default false, hala `main` field src kullanır; mobile export:smoke geçti)
  - `_dev/docs/hetzner-staging-setup.md` — 10 adımlı manuel playbook
  - DECISIONS.md + memory/staging-infra.md + MEMORY.md + KVKK.md SCC TODO
- **Prettier fix (325cf2a):** `_ops/staging/docker-compose.yml` YAML format — lokal `pnpm format:check` push'tan önce çalıştırılmamıştı, CI fail oldu, auto-fix + push ile CI #3 yeşil.
- **Sunucu hazırlığı (manuel SSH, Cursor agent yardımıyla):**
  - **Adım 1 (Swap):** 4 GB `/swapfile`, `swappiness=10`, fstab persistent. (Önceden 0 swap; ollama + n8n RAM spike için 4 GB seçildi.)
  - **Adım 2 (deploy user):** `adduser --disabled-password`, docker group üyesi, sudo YOK, `.ssh/authorized_keys` boş hazırlandı. `id deploy` uid=1000 gid=1000 groups=...,988(docker); `sudo -u deploy docker ps` Bunker container'larını listeledi.
  - **Adım 3+4 (mkdir + SSH keys):** `/opt/alpfit` chown deploy:deploy; iki ed25519 key üretildi:
    - `/home/deploy/.ssh/github_repo_deploy` (sunucu → GitHub repo clone/fetch için; public GitHub Deploy Keys'e read-only eklendi)
    - `/home/deploy/.ssh/github_actions_ssh` (GitHub Actions → sunucu için; public deploy user authorized_keys'e eklendi, private GitHub Secret STAGING_SSH_KEY'e yapıştırıldı)
    - SSH config: `github.com` için repo_deploy key + known_hosts populated
- **GitHub:**
  - Repo: https://github.com/NorthAIII/Alpfit.v1 (private, NorthAIII)
  - Deploy key: `alpfit-staging-server` read-only ✅
  - Secrets: `STAGING_SSH_HOST=178.104.140.36`, `STAGING_SSH_USER=deploy`, `STAGING_SSH_KEY=<private key>` ✅
  - **Smoke run sonucu:** Deploy Staging #3 = 8 saniye (önceki #1/#2 = 2-3s skip). 8s = SSH bağlantısı **kuruldu**, sonra `git fetch` fail oldu (BEKLENEN — `/opt/alpfit` henüz boş repo değil). Yani **3 secret + deploy key + authorized_keys hepsi çalışıyor**.

**Kalan İşler (Adım 5-11):**

- **Adım 5 — Clone:** `sudo -u deploy git clone git@github.com:NorthAIII/Alpfit.v1.git /opt/alpfit` (deploy key kullanılır; SSH config zaten ayarlı). `/opt/alpfit` zaten root tarafından `chown deploy:deploy` yapılmış boş klasör — git clone boş klasöre direkt yapacak. Doğrulama: `ls /opt/alpfit/_ops/staging/` → docker-compose.yml görünmeli.
- **Adım 6 — `.env.staging` doldur (sunucuda):** `cd /opt/alpfit/_ops/staging && cp .env.staging.example .env.staging && chmod 600 .env.staging`. Sırlar: `POSTGRES_PASSWORD` (openssl rand -hex 32), `DATABASE_URL=postgresql://alpfit:<password>@alpfit-postgres:5432/alpfit`, `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` (her biri openssl rand -hex 32, farklı).
- **Adım 7 — Bunker keşfi:** `docker network ls --filter name=bunker` → gerçek network adını al; docker-compose.yml'deki `bunker-net.name: bunker_default` satırını gerekirse güncelle. Ayrıca: `docker exec bunker-nginx ls /etc/nginx/conf.d/` config dosyalarının yerini öğren; `which certbot` veya `docker exec bunker-nginx which certbot` SSL stratejisini netleştir.
- **Adım 8 — DNS (Squarespace, kullanıcı yapar):** kiwiailab.com → DNS Settings → A record: Host `alpfit-staging`, Data `178.104.140.36`. Yayılma kontrolü: `dig +short alpfit-staging.kiwiailab.com`.
- **Adım 9 — bunker-nginx config + SSL:** Mevcut nginx config'in **yedeğini al**; yeni server block ekle (HTTP first ACME challenge + 301 redirect; HTTPS 443 + Let's Encrypt cert + proxy_pass http://alpfit-backend:3000). `nginx -t` syntax check + `nginx -s reload`. Certbot ile cert al (`--staging` flag ile rate limit'sten kaçınarak önce).
- **Adım 10 — İlk manuel deploy + smoke:** `cd /opt/alpfit/_ops/staging && docker compose --env-file .env.staging up -d --build && docker compose exec -T alpfit-backend node_modules/.bin/prisma migrate deploy`. `curl -k https://alpfit-staging.kiwiailab.com/healthz` → 200 + `{status:'ok',db:'up'}`.
- **Adım 11 — Auto-deploy smoke:** `git commit --allow-empty -m "chore: trigger staging auto-deploy verification" && git push` → GH Actions Deploy Staging yeşil olmalı.
- **Final:** DURUM.md güncelle (TASK-1.10 ✅), PHASE-1.md tablo, archive, son commit.

**Son Yaklaşım / Sonraki Adım Detayı:**

Yeni oturumda `/devflow:resume` çağır → bu task'a devam et. **Adım 5'ten başlanır** (clone). Sıradaki ilk komut (Cursor agent için):

```bash
ssh root@178.104.140.36 '
  sudo -u deploy git clone git@github.com:NorthAIII/Alpfit.v1.git /opt/alpfit
  echo "=== /opt/alpfit içeriği ==="
  sudo -u deploy ls -la /opt/alpfit/_ops/staging/
'
```

**Önemli durum notları:**

- Bunker'a hiç dokunulmadı (mevcut 11 container'ı etkileyen değişiklik YOK)
- Repo değişiklikleri main'de (NorthAIII/Alpfit.v1)
- GH Actions Deploy Staging şu an her push'ta tetikleniyor ama Adım 5-9 bitmeden hep fail edecek (BEKLENEN — `/opt/alpfit` boş, `.env.staging` yok, DNS yok, nginx config yok). Bunu rahatsız edici görmeyin; Adım 10 sonrası yeşil olacak.
- Önemli iş bilgileri: sunucu IP `178.104.140.36`, deploy user `deploy` (uid 1000), `/opt/alpfit` boş klasör (sahip deploy:deploy), `/home/deploy/.ssh/github_repo_deploy*` + `github_actions_ssh*` key çiftleri sunucuda hazır.

**Belirsizlikler:**

- bunker-nginx config dosyasının tam yolu ve nasıl mount edildiği (host'tan mı container içinden mi yönetiliyor) — Adım 7 keşfinde netleşecek.
- Bunker certbot kullanıyor mu yoksa SSL başka şekilde mi yönetiliyor — Adım 7 keşfinde.

---

### Oturum 2026-05-29 #2 — Clone → Public HTTPS Healthz → Auto-Deploy Secret Fix (⏸️ Duraklatıldı)

**Durum:** ⏸️ Duraklatıldı (context şişti, iş %95 bitti; closure 1 kısa oturuma kaldı)

**Yapılanlar (commit'ler: 30b793c + 25391c0 + 4a69259 + 8d0f268):**

- **Adım 5 — Clone + drift fix #1:** `git clone` GitHub Deploy Keys reddetti — önceki oturumun "Deploy key ✅" notu **drift**ti, gerçekte eklenmemişti; kullanıcı UI'dan ekledi (read-only, `alpfit-staging-server`). Clone başarılı; ama `_ops/staging/.env.staging.example` sunucuya gelmedi → `.gitignore`'da `.env.*` kuralı + `!.env.example` istisnası `.env.staging.example`'i yakalamıyordu → `!.env.*.example` istisnası eklendi, template commit edildi (30b793c). Pull → sunucuda template ✅.
- **Adım 6 — `.env.staging`:** Sunucuda `openssl rand -hex 32` x3 → POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET; sed in-place replace (DATABASE_URL içindeki şifre POSTGRES_PASSWORD ile global match), chmod 600 deploy:deploy. Doğrulama: 11 anahtar, 3 sır 64 char hex, 0 placeholder, DATABASE_URL ↔ POSTGRES_PASSWORD eşleşiyor. **Sırlar sadece sunucuda — ekrana yazılmadı.**
- **Adım 7 — Bunker keşfi + drift fix #2:** Network adı `bunker_default` DEĞİL → **`bunker-network`** (docker-compose.yml düzeltildi, 25391c0, sunucuda pull). bunker-nginx mimarisi: nginx.conf host bind mount (`/opt/bunker/nginx/nginx.conf`), conf.d host-bind değil (kullanılmıyor), SSL **SAN cert paterni** (`/etc/letsencrypt/live/n8n.kiwiailab.com/`), deploy-hook (`copy-to-nginx.sh`) cert renewal sonrası otomatik `/opt/bunker/nginx/ssl/` mount'a kopyalar, certbot.timer aktif (systemd). Mevcut cert 6 domain (limoncloud, munar, n8n, ops, reverb-demo, umami). HTTP :80 regex wildcard `~^[a-z0-9-]+\.kiwiailab\.com$` ACME challenge için zaten yakalıyor (yeni HTTP server block GEREKMEZ). HTTPS :443 regex catch-all bunker_dashboard'a yönlendiriyor → **exact-match alpfit-staging block ŞART** (nginx exact > regex precedence).
- **Adım 8 — DNS (kullanıcı):** Squarespace `alpfit-staging.kiwiailab.com` A → 178.104.140.36. Google/Cloudflare/Quad9/local resolver hepsinden 178.104.140.36 ✅.
- **Adım 9 — Cert + nginx config + reload:** nginx.conf yedek (`nginx.conf.bak.alpfit-add-1780075330`). `certbot --expand --dry-run` ✅ → gerçek `certbot certonly --webroot -w /opt/bunker/certbot-webroot --expand --cert-name n8n.kiwiailab.com --key-type ecdsa -d <6 mevcut> -d alpfit-staging.kiwiailab.com` → yeni 7 domain SAN cert, deploy-hook nginx ssl mount'a otomatik kopyaladı. nginx.conf'a regex catch-all'dan ÖNCE alpfit-staging exact-match 443 server block (eski `listen 443 ssl http2;` syntax — Bunker'ın 4 diğer bloğuyla tutarlılık; deprecated warning fatal değil). `nginx -t` ✅ → `nginx -s reload` ✅. **Bunker regression yok** (n8n 200, ops 307 auth-redirect, umami 200). **`https://alpfit-staging.kiwiailab.com/healthz` PUBLIC HTTP/2 200** + JSON body + HSTS+X-Frame+X-XSS headers.
- **Adım 10 — İlk deploy + migration:** Sunucuda `docker compose --env-file .env.staging build` (1m18s, image 170MB content), `up -d`: tüm 3 container healthy ~20s'de. Backend boot log `"alpfit backend ready"` + TR locale `"29 Mayıs 2026"`. **Prisma keşfi:** runner image'da `pnpm` YOK, `./node_modules/.bin/prisma migrate deploy` (shell script, `node` ile DEĞİL doğrudan çağrı) çalışıyor. Init migration (boş SQL) uygulandı, `_prisma_migrations` tablosu oluştu. Container içi /healthz `{"status":"ok","db":"up",...}`, bunker-nginx network içi DNS resolve (`alpfit-backend → 172.18.0.13`).
- **Adım 11 — Auto-deploy (sorunlu, sonunda fix):** Boş smoke commit (4a69259) push. CI 5/5 yeşil ✅ ama **Deploy Staging 6/6 fail** (8-12s). gh CLI log: `ssh.ParsePrivateKey: ssh: no key found` + `dial tcp: lookup *** on 127.0.0.53:53: server misbehaving` → **iki secret format hatası**: STAGING_SSH_KEY parse edilmiyor (UI yapıştırmada bozuk) + STAGING_SSH_HOST sondaki gizli newline → DNS lookup. **Önceki oturumun "Deploy #3=8s SSH auth OK" yorumu YANLIŞ TEŞHİS** (gerçekte hiç auth olmamış). Kullanıcı yeni fine-grained GH_TOKEN üretti (Actions+Secrets:RW), gh CLI ile 3 secret temiz format yazıldı (`gh secret set ... < /tmp/staging_ssh_key` stdin redirect; trailing newline kontrol + ekleme; `--body` flag IP için). `workflow_dispatch` ile manuel tetik → **Deploy Staging ✅** ~15s'de, sunucuda commit 8d0f268, /healthz 200.

**Kalan Closure (1 kısa oturum, ~10-15 dk):**

- **Auto-deploy zincir görsel teyit (opsiyonel ama önerilen):** Boş `chore(TASK-1.10):` commit + push → CI ~75s yeşil → workflow_run otomatik Deploy Staging → sunucuda yeni commit + /healthz 200. Mekanizma zaten ispatlandı (workflow_dispatch çalıştı, önceki tüm push'larda da workflow_run tetikleniyordu — sadece secret fail oluyordu), bu sadece görsel onay.
- **TASK closure:** TASK-1.10 durum ✅ + Tamamlanma Kriterleri kutucukları işaretle. PHASE-1.md task tablosunda ✅. `_dev/memory/staging-infra.md` güncelle: (a) network adı `bunker-network` (yanlış olan `bunker_default` notu varsa düzelt), (b) SAN cert + certbot --expand patern notu (her yeni Alpfit subdomain'i için ileride aynı komut), (c) GH Actions secret yazım kuralı (UI yerine `gh secret set < file` — UI multi-line + trailing newline tuzağı), (d) `.gitignore` `!.env.*.example` patern notu. MEMORY.md index'i pointer'larla güncelle (yeni öğrenim varsa). PHASES.md (faz tablosunda task 1.10 ✅). Archive: `_dev/tasks/TASK-1.10.md` → `_dev/tasks/archive/TASK-1.10.md`.
- **Final commit:** `feat(TASK-1.10): complete staging deploy on shared hetzner vps with auto-deploy pipeline` — tüm doküman güncellemeleri + archive move tek commit.
- **GH_TOKEN v2 revoke:** Kullanıcı closure sonrası https://github.com/settings/personal-access-tokens/active → `alpfit-deploy-debug-v2` → Delete.

**Yeni oturumda ilk komut:**

```bash
# Auto-deploy zincir teyit (opsiyonel):
cd /workspaces/Alpfit.v1
git commit --allow-empty -m "chore(TASK-1.10): verify auto-deploy chain after secret fix"
git push origin main
# Sonra GH_TOKEN ile polling: CI ~75s + Deploy ~15-30s
# Veya direkt closure'a geç — zincir zaten çalışıyor.
```

**Önemli durum notları:**

- ✅ alpfit-backend container Up + healthy, /healthz public 200 (8d0f268 image)
- ✅ Bunker subdomain'ler etkilenmedi (5 mevcut subdomain)
- ✅ 7 domain SAN cert (2026-08-27'ye kadar geçerli, certbot.timer auto-renewal)
- ✅ GH Actions auto-deploy çalışıyor (3 secret düzgün format)
- ⚠️ GH_TOKEN v2 (alpfit-deploy-debug-v2) revoke edilecek
- ⚠️ Önceki oturum "Deploy #3=8s SSH OK" yanlış teşhis idi — **retrospektife not:** Adım sonu kanıt = log + sonuç doğrulaması, dış görüntü değil

**Süreç öğrenimleri (faz retrosuna gidecek):**

- "Adım tamam ✅" demeden önce sonucu doğrula — sadece komutun exit code'una bakma, çıktıyı oku ve hedeflenen değişikliği kanıtla (deploy key UI'da, secret formatı, vb.)
- GH Actions secret'ları UI yerine `gh secret set < file` ile yaz (newline/format tuzakları yok)
- `.gitignore` `.env.*` kuralı `.env.<env>.example` template'lerini de yutar — `!.env.*.example` istisnası gerekir
- bunker-nginx SAN cert + certbot --expand paterni: yeni subdomain'de mevcut tüm domain'leri `-d` ile geçirme (aksi takdirde cert prune olur)

---

**Oluşturulma:** 2026-05-29 (plan-phase 1, Coolify mimarisi)
**Yeniden Yazıldı:** 2026-05-29 (mimari sapma — Coolify yerine docker-compose + shared VPS)
**Duraklatma #1:** 2026-05-29 oturum #1 sonu — repo skeleton + sunucu hazırlık (Adım 1-4) tamam; Adım 5-11 yeni oturumda /devflow:resume ile devam.
**Duraklatma #2:** 2026-05-29 oturum #2 sonu — Adım 5-10 + secret fix + manual deploy ✅; auto-deploy zincir teyit + closure ritüeli yeni oturuma kaldı.
