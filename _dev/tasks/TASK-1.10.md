# TASK-1.10: Hetzner + Coolify staging kurulumu + auto-deploy webhook

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.03, TASK-1.09

---

## Hedef

Hetzner Cloud CPX22 (Falkenstein, AB) sunucu hazırla, üzerine Coolify (latest stable) kur, staging environment'ı tanımla (Postgres 16 + Redis 7 services + backend app deployment), GitHub `main` branch'ine push olduğunda Coolify webhook'u tetiklensin ve otomatik staging deploy çalışsın. Backend `/healthz` staging URL'inden 200 dönmeli. Mobile bu task'ta deploy edilmiyor — Yakın 5'te EAS Build/Submit.

---

## Bağlam

Research-phase Hetzner + Coolify (Falkenstein) seçti — KVKK m.9 reformu sonrası AB en savunulabilir konum, ~€10/ay, staging+prod tek sunucu kabul (v1 pilot için). Discuss-phase: prod domain Yakın 5'te alınır; staging'de Coolify default URL veya geçici subdomain. Bu task'ta da prod environment henüz yok — sadece staging. Backblaze yedek TASK-1.16'da, restore drill orada.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §7 (CI/CD), §2 (Env & Secret)
- `_dev/phases/PHASE-1.md` — Araştırma → Hosting kararı + Dikkat Edilecekler #4 (Hetzner SPOF), #6 (KVKK m.9)
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Hetzner CPX22 + Coolify staging-prod ortak sunucu kararı
- `_dev/memory/` — sunucu IP, Coolify URL, dev OTP env değişkenleri (operasyonel sabitler) → `memory/staging-infra.md`
- `_dev/KVKK.md` — Standart Sözleşme (SCC) Hetzner ile imzalanma notu (TODO Yakın 4 öncesi hukuki danışman)

---

## Alt Görevler

- [ ] **1. Hetzner CPX22 sunucu hazırlık (manuel — kullanıcı adımları)**
  - Konum: Falkenstein veya Nuremberg (DE)
  - OS: Ubuntu 24.04 LTS
  - SSH key kurulumu (kullanıcının public key'i)
  - UFW: 22 (SSH), 80, 443 açık; ufw enable
  - System update + fail2ban
  - **Bu adımlar kullanıcı tarafından elle yapılır** — task dokümanında rehber sağlanır
  - Dosya: `_dev/docs/hetzner-setup.md` — manuel adım rehberi

- [ ] **2. Coolify kurulumu**
  - `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash` (resmi install script)
  - Coolify admin paneline ilk kullanıcı + admin e-posta
  - Reverse proxy: Coolify default Traefik
  - Coolify URL: `coolify.staging.<placeholder>.alpfit.app` veya Hetzner IP (Let's Encrypt ile)
  - Dosya: hetzner-setup.md (UPDATE)

- [ ] **3. Postgres 16 + Redis 7 services (Coolify resources)**
  - Coolify UI'dan Postgres 16 resource + Redis 7 resource (staging environment'ta)
  - Coolify auto-generated credentials → backend env'ine `DATABASE_URL`, `REDIS_URL` olarak inject edilir
  - Network: Coolify internal docker network (sunucudan dışarı erişim YOK; sadece backend app içeriden erişir)

- [ ] **4. Backend app deployment definition (Coolify)**
  - Source: GitHub repo + `main` branch
  - Build pack: Nixpacks veya custom Dockerfile (önerilen: custom Dockerfile, repeatability için)
  - Dockerfile (`backend/Dockerfile`) — multi-stage: builder (pnpm install + build) + runner (Node 22 slim + dist + node_modules production-only)
  - Env vars Coolify UI'dan girilir (DATABASE_URL, REDIS_URL, JWT secrets, SENTRY_DSN placeholder, LOG_LEVEL)
  - Migration `prisma migrate deploy` deploy hook'unda çalışır (Coolify "post-deploy command")
  - Dosya: `backend/Dockerfile`, `.dockerignore`

- [ ] **5. GitHub webhook → Coolify auto-deploy**
  - Coolify deployment trigger: GitHub webhook (Settings → Source → Webhook URL)
  - GitHub repo Settings → Webhooks → Coolify URL + secret
  - main push event → webhook tetiklenir → Coolify pull + build + deploy
  - Test: main'e küçük commit at, staging deploy'un başladığını ve `/healthz` 200 döndüğünü doğrula

- [ ] **6. Sunucu kalıcı operasyonel notlar (memory)**
  - `_dev/memory/staging-infra.md` — sunucu IP, Coolify URL, env değişkeni anahtar listesi (DEĞER YOK), Backblaze yedek hedefi (TASK-1.16'da dolar), KVKK SCC imza durumu
  - MEMORY.md index'ine "Ortam & Araç Notları" altına pointer ekle
  - Dosya: `_dev/memory/staging-infra.md`, `_dev/MEMORY.md` (UPDATE)

- [ ] **7. KVKK SCC notu**
  - `_dev/KVKK.md`'ye "TODO: Hetzner Cloud Standart Sözleşme (SCC) imzası — Yakın 4 öncesi hukuki danışman" satırı eklenir
  - Dosya: `_dev/KVKK.md` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── Dockerfile                          # YENİ
└── .dockerignore                       # YENİ
_dev/docs/
└── hetzner-setup.md                    # YENİ (manuel rehber)
_dev/memory/
└── staging-infra.md                    # YENİ
_dev/MEMORY.md                          # GÜNCELLE
_dev/KVKK.md                            # GÜNCELLE (SCC notu)
```

---

## Dikkat Noktaları

- **Manuel adımlar var:** Sunucu açma, Coolify install, Coolify UI ayarları kullanıcı tarafından yapılır. Bu task tek başına otomatik tamamlanamaz — rehber doküman + birlikte adım adım ilerleme.
- **Hetzner SPOF (Araştırma §Tuzak #4):** Bu kabul edilmiş bir karar; mitigation Backblaze yedek (TASK-1.16) + manuel restore drill. v1.5'te HA Postgres değerlendirilir.
- **KVKK m.9 (Araştırma §Tuzak #6):** AB hosting argümanı **Standart Sözleşme + üye açık rıza** ikilisiyle savunulur. SCC imzası KVKK.md'ye TODO olarak işaretlenir; Yakın 4 öncesi hukuki danışman onayı şart.
- **Coolify webhook secret:** GitHub webhook secret Coolify'dan alınır + `gh secret set` ile repo secret'larına eklenir; `.env.example`'da `COOLIFY_WEBHOOK_SECRET` listelenir.
- **Production environment:** Bu task'ta staging-only; production environment Yakın 5 öncesi açılır (Coolify'da ayrı environment + ayrı DB + ayrı domain).
- **Coolify `prisma migrate deploy` hook'u:** Migration başarısız olursa deploy fail; rollback Coolify previous version'a manuel.
- **Dev OTP test kanalı:** TASK-1.17'deki mock SMS provider staging'de `dev_otp_log` üzerinden okur; production'da disabled (env flag ile guard).

---

## Test Kriterleri

- [ ] Hetzner sunucu erişilebilir, SSH çalışır
- [ ] Coolify admin paneli açılır, ilk admin user oluşturulur
- [ ] Coolify'dan Postgres + Redis services açılır, internal connection string'leri üretilir
- [ ] Backend Dockerfile local'de `docker build` ile hatasız build olur
- [ ] main branch'e push → Coolify webhook tetiklenir → backend deploy olur
- [ ] Staging URL `/healthz` → 200 + `{ status: 'ok', db: 'up' }`
- [ ] `prisma migrate deploy` deploy hook'unda çalışır, migration tablosu staging DB'de doğru
- [ ] Yanlış env değişkeni ile deploy denenirse backend zod parse hatasıyla **fail fast** eder, Coolify deploy fail durumuna düşer (sessiz başarısız değil)

---

## Karar Noktaları

- **Build pack Dockerfile mı Nixpacks mı:** Nixpacks setup hızlı ama kara kutu; custom Dockerfile bir sefer yazılır + reproducibility + Prisma generate adımı explicit. → **Custom Dockerfile öneririm** ([[ilkeler]] §"Kalıcılık önceliği").
- **Staging domain:** Coolify default URL (IP-based) vs geçici subdomain (örn. `staging.<placeholder>.alpfit.app`)? → Default URL bu fazda yeterli; domain Yakın 5'te.
- **Coolify backup dahil mi yedek:** Coolify günlük DB backup kendisi yapar, ama Backblaze off-site yedek TASK-1.16'da. İkisi de gerekli (Coolify in-server, B2 off-site).

---

## Risk ve Geri Dönüş Planı

- **Risk:** Coolify install script'i sunucuyu beklenmedik şekilde değiştirebilir (firewall, docker config).
  - **Mitigation:** Önce snapshot al (Hetzner snapshot ücretsiz değil ama ucuz); install başarısızsa snapshot'tan dön.
- **Risk:** Webhook secret expose olursa attacker push tetikleyebilir (ama gerçek build yapamaz, sadece deploy retry).
  - **Mitigation:** Webhook secret rotate-on-suspicion; GitHub Secret + Coolify secret bağı.
- **Rollback:** Coolify previous deployment'a manuel revert; DB rollback için Backblaze restore (TASK-1.16'da prosedür).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı (kullanıcı manuel adımları dahil)
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.10): set up hetzner coolify staging with auto-deploy`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Hetzner CPX22 + Coolify + staging-prod ortak sunucu kararı
- [ ] MEMORY.md + `memory/staging-infra.md` eklendi
- [ ] KVKK.md SCC TODO satırı eklendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
