# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.11 ✅: backend Sentry @sentry/node 10.55 + fast-redact 3.5 kuruldu; 3 katmanlı KVKK PII savunması (Sentry `sendDefaultPii: false` + `beforeSend` recursive scrubber + pino fast-redact 4 seviye wildcard); PII_FIELDS SSOT `shared/src/pii-fields.ts` (kimlik + Madde 6 sağlık verisi + yemek + not + rıza + auth/sır; camelCase + snake_case); `initSentry()` DSN yoksa no-op (degrade mode); 11 test PASS (Sentry beforeSend × 3 + scrubPii × 3 + hashUserId × 3 + pino redact + negatif kanıt); user ID sha256-12 hash; `docs/sentry-setup.md` (Sentry Cloud EU proje + quota webhook 80%/100% + Spike Protection + KVKK Settings + manuel smoke); süreç disiplini `memory/kvkk-pii-scrubbing-matrisi.md` 4 kontrol anı (DB schema task'i + yeni endpoint + PR review + faz review); DECISIONS "3 Katmanlı KVKK PII Scrubbing Matrisi"; sıradaki TASK-1.12 mobile Sentry — aynı PII_FIELDS paylaşılır.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 11/34 task tamam; sıradaki TASK-1.12 mobile Sentry crash reporting + PII scrubber
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)

---

## Aktif Versiyon

**Versiyon:** v1
**Hedef:** Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi — kardeş (1 PT) + 3-4 öğrencisi, ~90 gün pilot.
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->

---

## Aktif Task

**Task:** Yok — TASK-1.11 ✅ tamamlandı, sıradaki TASK-1.12 (mobile Sentry crash reporting + PII scrubber) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.12` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 11 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03 | Prisma 7 + adapter-pg + ilk migration + generate smoke | ✅ Tamamlandı |
| 1.04 | Backend test altyapısı (Vitest + per-suite Postgres) | ✅ Tamamlandı |
| 1.05 | Mobile Expo SDK 56 + Expo Router iskelet | ✅ Tamamlandı |
| 1.06 | TR locale util + lint kuralı (toLowerCase yasağı) | ✅ Tamamlandı |
| 1.07 | i18n shell (i18next mobile + backend, TR-only) | ✅ Tamamlandı |
| 1.08 | Mobile test altyapısı (Jest + RTL + MSW) | ✅ Tamamlandı |
| 1.09 | CI PR pipeline (GitHub Actions: test + lint + typecheck) | ✅ Tamamlandı |
| 1.10 | Staging deploy (shared VPS — docker-compose + bunker-nginx + GH Actions) | ✅ Tamamlandı |
| 1.11 | Backend Sentry + PII scrubber + KVKK test | ✅ Tamamlandı |
| 1.12–1.16 | M0 Altyapı (mobile Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (5) |
| 1.17–1.25 | M1 Auth backend (SMS, OTP, JWT, refresh, davet, deep link) | ⬜ Bekliyor (9) |
| 1.26–1.34 | M1 Mobile UI + akış + smoke (onboarding ekranları, PT üyeler tab, banner, auto-login, e2e smoke) | ⬜ Bekliyor (9) |

**Durum Kodları:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## Engelleyici Ön-Koşullar

Aşağıdaki ön-koşullar ilgili fazlar başlamadan önce çözülmüş olmalı. Discuss-phase'de fazın milestone'una bunlardan birine bağımlıysa, faz bu blocker çözülmeden başlatılmaz.

| Ön-koşul | Blocker olduğu faz konusu | Notlar |
|---|---|---|
| 🔴 **KVKK aydınlatma + sağlık verisi açık rıza metni** (TR, hukuki danışman review'lu) | Yakın 4 (PT dashboard + Sağlık verisi) | Ölçüm + yemek günlüğü bu metin olmadan tamamlanamaz. `KVKK.md` boş şablon olarak duruyor. `/devflow:prd-refine` veya hukuki danışmanla erken oturum gerekir. |
| 🔴 **Çekirdek 50 egzersiz listesi + videolar** | Yakın 5 (UAT + Pilot launch) | Placeholder ile Yakın 2'de program builder'a başlanabilir, ama launch öncesi liste + video kararı şart. Kardeşle ortak liste + video çekim/lisans kararı. Bütçe + zaman karar gerekir. |
| 🟡 **Kardeşin "mevcut WhatsApp+Word program yazma süresi" baseline ölçümü** | Yakın 2 (Program akışı uçtan uca) | [[ilkeler]] §En Yüksek Öncelikli Eksen #2 "2× hız" hedefinin doğrulanması için gerekli. Basit ölçüm: kardeşten "yeni üye için kaç dakika sürdü" notu — pahalı değil ama unutulmasın. |

---

## Son Task Özetleri

> **KURAL:** Sadece son 2 task özeti tutulur, daha eskileri **gerçekten silinir** (HTML comment'e sarma, "Önceki:" prefix, üstü çizili etiket yasak — detay için git log + arşivlenmiş task dokümanı). Her özet kısa formatlı: paragraf yasak, **bullet zorunlu**, "Özet" alanı max 3 bullet.

### TASK-1.10 — Staging deploy (shared Hetzner VPS — docker-compose + bunker-nginx + GH Actions) (2026-05-29) ✅

- **3 oturumda 11 commit + mimari sapma:** Orijinal Coolify kararı (PHASE-1 araştırma) Bunker'la paylaşımlı CPX32 Nuremberg sunucusunda 80/443 çakışması nedeniyle bırakıldı — **docker-compose + bunker-nginx subdomain proxy + GH Actions SSH auto-deploy** seçildi. Detay: DECISIONS.md "TASK-1.10 Staging Deploy". Repo skeleton oturum #1 (3b24234 + fd23c73 + 325cf2a): `backend/Dockerfile` multi-stage node:22-bookworm builder + bookworm-slim runner + non-root + dumb-init + pnpm deploy prune; `_ops/staging/docker-compose.yml` 3 container internal-only network; `.github/workflows/deploy-staging.yml` workflow_run after CI on main + appleboy/ssh-action; manuel playbook `_dev/docs/hetzner-staging-setup.md`; memory + DECISIONS + KVKK SCC TODO. Drift fix #1 (30b793c): `.gitignore` `!.env.*.example` istisnası — `.env.*` template'i yutuyordu. Drift fix #2 (25391c0): network adı `bunker_default` → **`bunker-network`** (gerçek sunucu keşfi).
- **Sunucu hazırlığı + deploy (oturum #2, 4a69259 + 8d0f262):** 4 GB swap fstab persistent; `deploy` user (uid 1000, docker group, no-sudo); 2 ed25519 SSH key (repo deploy + GH Actions); GitHub Deploy Keys (read-only `alpfit-staging-server`); 3 secret (STAGING_SSH_HOST/USER/KEY); Squarespace DNS A record alpfit-staging → 178.104.140.36; bunker keşfi — `bunker-nginx` host bind mount nginx.conf, conf.d **kullanılmıyor**, **SAN cert** ana ad `n8n.kiwiailab.com`, certbot.timer + deploy-hook auto-renewal. Cert yenileme: `certbot certonly --webroot --expand --cert-name n8n.kiwiailab.com -d <6 mevcut> -d alpfit-staging.kiwiailab.com` — 7-domain SAN cert (mevcutları `-d` ile geçirmek **şart**, aksi prune). nginx.conf yedek alındı + alpfit-staging exact-match 443 server block regex catch-all'dan **ÖNCE** eklendi (nginx exact > regex precedence) + `nginx -t` + reload. **Bunker 5 mevcut subdomain regression yok** (n8n 200, ops 307, umami 200). Backend image build 1m18s + 3 container healthy 20s + Prisma init migration (`./node_modules/.bin/prisma migrate deploy` — runner image'da `pnpm` YOK, doğrudan shell script). **Public `https://alpfit-staging.kiwiailab.com/healthz` HTTP/2 200** + JSON body + HSTS+X-Frame headers.
- **Auto-deploy secret fix (oturum #2):** İlk 6 Deploy Staging run fail (`ssh.ParsePrivateKey: no key found` + `STAGING_SSH_HOST` trailing newline DNS lookup); önceki oturumun "Deploy #3 = 8s SSH OK" yorumu **yanlış teşhis** idi. Çözüm: `gh secret set NAME < /tmp/secret_file` (stdin redirect) ile 3 secret temiz format → `workflow_dispatch` deploy ✅ ~15s, sunucuda 8d0f268 sync + /healthz 200. GH_TOKEN v2 (`alpfit-deploy-debug-v2`) 7 gün — kullanıcı revoke edecek.
- **Closure (oturum #3, bu commit):** Kullanıcı kararıyla push-tetik zincir görsel teyit atlandı (mekanizma `workflow_dispatch` ile ispatlanmıştı, ekstra token üretim maliyeti değer üretmiyordu). TASK doc durum ✅ + 10 alt görev + 12 test + 9 tamamlanma kriteri kutucukları. PHASE-1 tablo 1.10 ✅. `staging-infra.md` drift fix (network, swap, SSH key adı) + 5 yeni öğrenim (SAN cert + `certbot --expand` paterni, `gh secret set < file` UI yerine, `.env.*.example` gitignore istisnası, runner image `pnpm` yok prisma çağrısı, **adım kanıtı disiplini** — exit code değil log + sonuç hedeflenen değişikliği kanıtlamalı). MEMORY.md index + DURUM.md güncel; archive.
- Test kriterleri ✅ — Public HTTPS /healthz 200 + JSON, 3 container healthy, Prisma migration uygulandı, HTTP→HTTPS redirect + Let's Encrypt SAN cert geçerli, workflow_dispatch deploy + sunucuda commit sync + /healthz 200, bunker regression yok.

### TASK-1.09 — CI PR pipeline (GitHub Actions: test + lint + typecheck) (2026-05-29) ✅

- **Workflow (`.github/workflows/ci.yml`):** 4 paralel job — `quality` (root `pnpm lint` + `pnpm format:check`), `shared`, `mobile`, `backend`. Trigger `pull_request` (tüm dallar) + `push:main`; `concurrency.group: ${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`. Setup zinciri her job'da ortak: `actions/checkout@v4` → `pnpm/action-setup@v4` (versiyon root `packageManager: pnpm@10.11.0`'dan) → `actions/setup-node@v4` (`node-version: '22'`, `cache: pnpm`) → `pnpm install --frozen-lockfile`. Coverage upload her test job'unda (`actions/upload-artifact@v4`, `if: always()`, `if-no-files-found: ignore`).
- **Backend job tasarımı:** `container.image: node:22-bookworm` + `services.postgres` (`postgres:17-alpine`, env `dev/dev/dev`, `pg_isready` health check 10×5s). Job-level `env.DATABASE_URL: postgres://dev:dev@postgres:5432/dev` — hostname `postgres` yalnızca job container'da resolve olur (devcontainer paterniyle birebir; `backend/test/setup.ts` stub URL'i hiçbir değişiklik olmadan çalışır). Adımlar: `pnpm -F @alpfit/backend db:generate` (Prisma 7 tuzak #1.c explicit mitigation — `pretest`/`pretypecheck` hook'larından bağımsız görünür) → `typecheck` → `test:coverage`. TASK-1.04 DECISIONS'taki per-suite Postgres patern'ine bağlı (Testcontainers değil).
- **Branch protection (manuel UI seçimi):** Kullanıcı `AskUserQuestion` ile manuel UI + rehber dokümanı seçti (gh CLI script yerine — repo henüz remote'a push edilmedi). `.github/CI-SETUP.md` Settings → Branches → Add rule adım-adım, status check isim listesi (`Lint & Format`, `Shared (typecheck + test)`, `Mobile (typecheck + test)`, `Backend (db:generate + typecheck + test)`), "Require branches up to date" + "Do not allow bypassing" + kasten kırık PR ile koruma doğrulama smoke testi yönergesi. `.github/PULL_REQUEST_TEMPLATE.md` özet + bağlantı + commit prefix + test planı + DevFlow doküman güncellemesi + KVKK/gizlilik checklist.
- **Önemli sapmalar:** (a) Task doc 3 paralel job öngörüyordu — workspace-başına lint script gerektiren bu şema yerine 4. job (`quality` — root lint+format:check) eklendi, package.json drift riski yok. (b) Task doc "Testcontainers" diyordu — TASK-1.04 DECISIONS'taki per-suite Postgres patern'i baskın. (c) `postgres:17-alpine` (16 değil — devcontainer ile aynı majör). DECISIONS 2026-05-29 §"CI PR Pipeline" tam analizi içerir.
- Test kriterleri ✅ — workflow YAML `js-yaml` ile semantik parse edildi (`jobs: quality, shared, mobile, backend`); lokalde `pnpm lint` ✓ + `pnpm format:check` ✓ (CI-SETUP.md prettier-format'a hizalandı) + `pnpm typecheck` recursive ✓ (shared + mobile + backend pretypecheck shared build + db:generate dahil) + `pnpm -F @alpfit/{shared,mobile,backend} test:coverage` 3'ü de ✓. Gerçek PR-time tetikleme ve branch protection smoke repo remote'a push edildikten sonra kullanıcı tarafından doğrulanır.

### TASK-1.11 — Backend Sentry + PII scrubber + KVKK test (2026-05-29) ✅

- **3 katmanlı KVKK PII savunması:** (a) `@sentry/node@10.55.0` init `sendDefaultPii: false` + `tracesSampleRate` prod 0.1 / dev-staging 1.0 + `environment: APP_ENV`; (b) `sentryBeforeSend<E extends Event>(e: E): E` recursive scrubber — `event.request.{data, cookies, query_string, headers}` + `event.user` (id sha256-12 hash, email/username/ip_address sil) + `event.extra` + `event.contexts` + `event.breadcrumbs[].data`; (c) pino `redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' }` her PII alanı için 4 seviye wildcard (`field`, `*.field`, `*.*.field`, `*.*.*.field`). Sentry'nin `Event` (genel) vs `ErrorEvent` (`type: undefined`) tipi gerilimi generic ile çözüldü.
- **PII_FIELDS SSOT (`shared/src/pii-fields.ts`):** readonly tuple; kimlik (phone/phoneNumber/phone_number/mobile/tel/email/name/firstName/.../displayName) + Madde 6 sağlık verisi (weight/height/measurement(s)/bodyFat/bmi/waist/hip/chest/arm/thigh) + yemek (foodLog/meal(s)/mealLog/food/calories/kcal/macros/protein/carbs/fat) + not(s)/comment(s) + rıza (kvkkConsent/healthDataConsent/consent) + auth/sır (password/otp/otpCode/smsCode/verificationCode/token/accessToken/refreshToken/secret/apiKey/authorization). camelCase + snake_case birlikte. `getPinoRedactPaths()` 4 seviye wildcard üretir. Backend + (TASK-1.12) mobile paylaşır. `shared/src/index.ts` re-export.
- **Degrade mode + entrypoint:** `initSentry({env, dsn?, release?})` `SENTRY_DSN` env yoksa false döner + (staging/prod'da) stderr warning; app çalışmaya devam eder. `backend/src/index.ts` `start()` akışına `buildServer()` öncesi `initSentry({env})` çağrısı eklendi — Sentry sonraki kod path'i içindeki hataları yakalasın.
- **Test (`pii-scrubber.test.ts`):** 11 PASS — Sentry beforeSend × 3 (PII alanlı kompleks event scrub, missing fields graceful, breadcrumb data); scrubPii × 3 (immutable, array, cyclic ref); hashUserId × 3 (12 hex format, deterministic, farklı input farklı çıktı); pino redact × 1 (JSON stdout capture — `phone/weight/mealLog/password/email` `[REDACTED]`, `traceId/msg` korundu, raw değerler yok); negatif kanıt × 1 (`event.user.id` hash format, ham `phone` `[REDACTED]`, serialized event'te `+90555...` ve raw user-id yok). Sentry SDK gerçekten init edilmez (network/global state riski) — scrubber doğrudan çağrılır.
- **Doküman + disiplin:** `_dev/docs/sentry-setup.md` — Sentry Cloud EU proje açma (`.de.sentry.io` DSN doğrulaması) + DSN env wiring (`/opt/alpfit/_ops/staging/.env.staging`) + quota webhook 80%/100% Settings → Usage & Billing → Notifications + Spike Protection per-project + KVKK Security & Privacy checklist (Data Scrubbing + Additional Sensitive Fields redundant + EU Frankfurt residency + 30 gün retention) + release tracking opsiyonel + manuel staging smoke senaryosu + haftalık quota check. `_dev/memory/kvkk-pii-scrubbing-matrisi.md` Süreç Disiplini: SSOT yeri, 3 katman matrisi, 4 kontrol anı (DB schema task, yeni endpoint task, PR review, faz review), wildcard 4 seviye sınırı uyarısı, test bağı. MEMORY.md "Süreç Disiplinleri" altına pointer. DECISIONS.md "3 Katmanlı KVKK PII Scrubbing Matrisi" kararı (4 seçenek + tradeoff'lar).
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` 20 PASS (11 pii-scrubber + 9 healthz). `pnpm -F @alpfit/backend typecheck` temiz. `pnpm lint`/`format:check`/`typecheck` (recursive) temiz. Manuel staging Sentry dashboard smoke (`docs/sentry-setup.md §6`) gerçek Sentry projesi açıldıktan sonra yapılır — kapsam dışı, kod + rehber teslim edildi.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.11 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.12` (mobile Sentry crash reporting + PII scrubber, PII_FIELDS SSOT'u paylaşır)

---

**Son Güncelleme:** 2026-05-29 — TASK-1.11 ✅: backend Sentry @sentry/node 10.55 + fast-redact 3.5 kuruldu; 3 katmanlı KVKK PII savunması (Sentry `sendDefaultPii: false` + `beforeSend` recursive scrubber + pino fast-redact 4 seviye wildcard); PII_FIELDS SSOT `shared/src/pii-fields.ts` (kimlik + Madde 6 sağlık verisi + yemek + not + rıza + auth/sır; camelCase + snake_case); `initSentry()` DSN yoksa no-op (degrade mode); 11 test PASS (Sentry beforeSend × 3 + scrubPii × 3 + hashUserId × 3 + pino redact + negatif kanıt); user ID sha256-12 hash; `docs/sentry-setup.md` (Sentry Cloud EU proje + quota webhook 80%/100% + Spike Protection + KVKK Settings + manuel smoke); süreç disiplini `memory/kvkk-pii-scrubbing-matrisi.md` 4 kontrol anı (DB schema task'i + yeni endpoint + PR review + faz review); DECISIONS "3 Katmanlı KVKK PII Scrubbing Matrisi"; sıradaki TASK-1.12 mobile Sentry — aynı PII_FIELDS paylaşılır.
