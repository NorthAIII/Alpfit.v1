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

### Oturum 2026-05-29 — Mimari Sapma Kararı + Repo Hazırlığı

**Durum:** 🔄 Devam ediyor

**Yapılanlar:**
- SSH keşfi: Bunker sunucusu (Hetzner CPX32, Nuremberg, 178.104.140.36) tamamen Docker'da — 11 container (bunker-nginx 80/443, dashboard 3000, n8n, postgres:15, redis, qdrant, ollama, adminer, umami)
- RAM 7.6 GB → 5.2 GB serbest; disk 150 GB → %77 dolu; swap yok
- Mimari sapma kararı: Coolify yerine docker-compose + bunker-nginx subdomain proxy + GH Actions SSH deploy
- Kullanıcı subdomain (`alpfit-staging.kiwiailab.com`) + DNS provider (Squarespace) + swap dahil etme onaylar
- `_dev/docs/DECISIONS.md`'ye yeni mimari kararı yazıldı
- `_dev/tasks/TASK-1.10.md` yeniden yazıldı (bu doküman)

**Sonraki Adım Detayı:** Repo dosyalarını oluştur (Dockerfile, docker-compose, GH workflow, manuel rehber doc), lokal docker build smoke, sonra kullanıcıyla SSH üzerinden sunucu kurulumu (swap, deploy user, /opt/alpfit, bunker-nginx config, DNS, ilk deploy).

---

**Oluşturulma:** 2026-05-29 (plan-phase 1, Coolify mimarisi)
**Yeniden Yazıldı:** 2026-05-29 (mimari sapma — Coolify yerine docker-compose + shared VPS)
