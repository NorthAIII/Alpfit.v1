# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.10 ⏸️ Duraklatıldı (oturum #2 sonu, context şişti): Adım 5-10 ✅ (clone+.gitignore drift fix+.env.staging sırlı doldu+bunker keşfi: bunker-network/SAN cert+webroot+deploy-hook+squarespace DNS+certbot --expand 7 domain+nginx server block+reload+ilk deploy: backend healthy, prisma migrate deploy uygulandı, public https://alpfit-staging.kiwiailab.com/healthz 200), Adım 11 auto-deploy: GH Actions secrets bozuk format hatası (ssh.ParsePrivateKey: no key found + DNS lookup trailing newline) → gh CLI ile 3 secret'ı temiz format ile yeniden yazıldı → workflow_dispatch başarılı (8d0f268 sunucuya sync, /healthz 200); kalan: boş commit ile push→CI→workflow_run zincir görsel teyit + TASK closure (doküman/archive); GH_TOKEN v2 (alpfit-deploy-debug-v2) 7 gün aktif — kullanıcı task bitiminde revoke edecek.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 9/34 task tamam + TASK-1.10 ⏸️ Duraklatıldı (oturum #1 sonu: Adım 1-4 ✅, Adım 5-11 kaldı); yeni oturumda `/devflow:resume` → Adım 5 (clone) ile devam
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

**Task:** TASK-1.10 — Staging deploy (shared Hetzner VPS — docker-compose + bunker-nginx subdomain proxy + GH Actions auto-deploy)
**Durum:** ⏸️ Duraklatıldı (oturum #2 sonu, context şişti — neredeyse bitti)
**İlerleme:** Adım 5-10 + GH secrets fix + workflow_dispatch deploy başarılı ✅. Public `https://alpfit-staging.kiwiailab.com/healthz` 200 dönüyor. Kalan iki ufak iş: (1) boş commit ile push→CI→workflow_run zincirini görsel teyit (~5-7 dk), (2) TASK closure ritüeli (TASK durumu ✅, PHASE-1 tablo, memory/staging-infra.md güncellemesi network adı + secret durumu, archive, final commit). Detay TASK-1.10.md "Oturum 2026-05-29 #2" bölümünde.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 9 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.10 | Staging deploy (shared VPS — docker-compose + bunker-nginx + GH Actions) | ⏸️ Duraklatıldı (Adım 1-10 ✅ + manual deploy + secret fix, kalan: zincir teyit + closure) |
| 1.11–1.16 | M0 Altyapı (Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (6) |
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

### TASK-1.09 — CI PR pipeline (GitHub Actions: test + lint + typecheck) (2026-05-29) ✅

- **Workflow (`.github/workflows/ci.yml`):** 4 paralel job — `quality` (root `pnpm lint` + `pnpm format:check`), `shared`, `mobile`, `backend`. Trigger `pull_request` (tüm dallar) + `push:main`; `concurrency.group: ${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`. Setup zinciri her job'da ortak: `actions/checkout@v4` → `pnpm/action-setup@v4` (versiyon root `packageManager: pnpm@10.11.0`'dan) → `actions/setup-node@v4` (`node-version: '22'`, `cache: pnpm`) → `pnpm install --frozen-lockfile`. Coverage upload her test job'unda (`actions/upload-artifact@v4`, `if: always()`, `if-no-files-found: ignore`).
- **Backend job tasarımı:** `container.image: node:22-bookworm` + `services.postgres` (`postgres:17-alpine`, env `dev/dev/dev`, `pg_isready` health check 10×5s). Job-level `env.DATABASE_URL: postgres://dev:dev@postgres:5432/dev` — hostname `postgres` yalnızca job container'da resolve olur (devcontainer paterniyle birebir; `backend/test/setup.ts` stub URL'i hiçbir değişiklik olmadan çalışır). Adımlar: `pnpm -F @alpfit/backend db:generate` (Prisma 7 tuzak #1.c explicit mitigation — `pretest`/`pretypecheck` hook'larından bağımsız görünür) → `typecheck` → `test:coverage`. TASK-1.04 DECISIONS'taki per-suite Postgres patern'ine bağlı (Testcontainers değil).
- **Branch protection (manuel UI seçimi):** Kullanıcı `AskUserQuestion` ile manuel UI + rehber dokümanı seçti (gh CLI script yerine — repo henüz remote'a push edilmedi). `.github/CI-SETUP.md` Settings → Branches → Add rule adım-adım, status check isim listesi (`Lint & Format`, `Shared (typecheck + test)`, `Mobile (typecheck + test)`, `Backend (db:generate + typecheck + test)`), "Require branches up to date" + "Do not allow bypassing" + kasten kırık PR ile koruma doğrulama smoke testi yönergesi. `.github/PULL_REQUEST_TEMPLATE.md` özet + bağlantı + commit prefix + test planı + DevFlow doküman güncellemesi + KVKK/gizlilik checklist.
- **Önemli sapmalar:** (a) Task doc 3 paralel job öngörüyordu — workspace-başına lint script gerektiren bu şema yerine 4. job (`quality` — root lint+format:check) eklendi, package.json drift riski yok. (b) Task doc "Testcontainers" diyordu — TASK-1.04 DECISIONS'taki per-suite Postgres patern'i baskın. (c) `postgres:17-alpine` (16 değil — devcontainer ile aynı majör). DECISIONS 2026-05-29 §"CI PR Pipeline" tam analizi içerir.
- Test kriterleri ✅ — workflow YAML `js-yaml` ile semantik parse edildi (`jobs: quality, shared, mobile, backend`); lokalde `pnpm lint` ✓ + `pnpm format:check` ✓ (CI-SETUP.md prettier-format'a hizalandı) + `pnpm typecheck` recursive ✓ (shared + mobile + backend pretypecheck shared build + db:generate dahil) + `pnpm -F @alpfit/{shared,mobile,backend} test:coverage` 3'ü de ✓. Gerçek PR-time tetikleme ve branch protection smoke repo remote'a push edildikten sonra kullanıcı tarafından doğrulanır.

### TASK-1.08 — Mobile test altyapısı (Jest + RTL) (2026-05-29) ✅

- **Paketler:** `bundledNativeModules.json` ile çapraz doğrulanıp `jest@^29.7.0` + `jest-expo@~56.0.4` + `@testing-library/react-native@^13.3.3` + `react-test-renderer@19.2.6` (React 19.2.6 ile pin) + `@react-native/jest-preset@^0.85.3` (jest-expo peer) + `msw@^2.14.6` + `whatwg-fetch@^3.6.20` + `@types/jest@^29.5.14` mobile devDeps'e eklendi. Modern RTL matchers seçildi (kullanıcı onayı) — deprecated `@testing-library/jest-native` paketi alınmadı; `expect.extend(require('@testing-library/react-native/matchers'))` ile aktive edildi.
- **Jest config (`mobile/jest.config.js`):** `preset: 'jest-expo/ios'` tek-platform (universal multi-project'in 4× koşum süresini engeller); `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']`; MSW v2 conditional export'ları için `testEnvironmentOptions.customExportConditions: ['node', 'node-addons']`; `.mjs` transform'u babel-jest'e açıldı (rettime ESM zinciri); `transformIgnorePatterns` daraltıldı (sadece `react-native-reanimated/plugin/` + `@react-native/babel-preset/` ignore; geri kalan node_modules transform edilir — jest-expo'nun karmaşık iç-içe `.pnpm/<pkg>/node_modules/<pkg>` whitelist'inde MSW deps ve expo-modules-core/src yakalanıyordu); `moduleNameMapper` `.js→.ts` shim + `@alpfit/shared` workspace path.
- **Test altyapısı dosyaları:** `mobile/test/setup.ts` (matchers + MSW server lifecycle beforeAll/afterEach/afterAll + `NODE_ENV=test`); `mobile/test/render-with-providers.tsx` (custom render: `I18nextProvider` wrap); `mobile/test/msw/{server.ts,handlers.ts,README.md}` (boş default handlers; suite-level `server.use(...)` pattern + KVKK koruması olarak `onUnhandledRequest: 'error'`); `mobile/test/README.md` (i18n pattern, snapshot policy, coverage notu). Test'ler `mobile/__tests__/landing-screen.test.tsx` — jest-expo snapshot resolver `__tests__/` substring'i `__snapshots__/`'a replace eder, bu yüzden test app/ dışına taşındı (Expo Router scan etmez + snapshot path uyumlu); snapshot dosyası `__tests__/__snapshots__/landing-screen.test.tsx.snap.ios`.
- **Scripts + tsconfig + eslint:** `mobile/package.json`'a `test/test:watch/test:coverage`; `mobile/tsconfig.json` `types: [...'jest']` + include `__tests__/**/*` + `test/**/*`; `eslint.config.mjs` CommonJS allowlist'ine `jest.config.js` eklendi (require/module/__dirname).
- Test kriterleri ✅ — `pnpm -F @alpfit/mobile test` 2 passed (`Merhaba Alpfit` text query + snapshot match, 0.95s), `pnpm typecheck` 3 paket temiz, `pnpm lint` temiz, `pnpm format:check` temiz, `pnpm test` recursive 52 passed (41 shared + 9 backend + 2 mobile), `pnpm -F @alpfit/mobile run export:smoke` 1.7MB web bundle (regression yok).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

> ⏸️ **TASK-1.10 Duraklatıldı (2026-05-29 oturum #2 sonu)** — Context şişti; iş %95 bitti, /devflow:resume ile kısa closure.
>
> **Bu oturumda tamamlanan:** Adım 5-10 (clone + 2 drift fix: `.gitignore` `.env.*.example` izni + `bunker-network` adı; sırlı `.env.staging`; bunker keşfi; Squarespace DNS; `certbot --expand` 7 domain SAN; nginx server block + reload; backend image build + compose up; prisma migrate deploy; container içi + bunker-nginx + **public HTTPS /healthz 200**) + **Adım 11 GH Actions secret fix** (önceki oturumun "Deploy #3 = 8s SSH OK" yorumu yanlış teşhisti — gerçekte `ssh.ParsePrivateKey: no key found` + `STAGING_SSH_HOST` trailing newline DNS lookup hatası; gh CLI ile 3 secret temiz format yazıldı; workflow_dispatch deploy ✅ — sunucuda 8d0f268, /healthz 200).
>
> **Kalan (~1 kısa oturum):** (a) Boş commit push → CI yeşil → workflow_run otomatik tetik → Deploy zinciri görsel teyit (~5-7 dk). (b) TASK closure: TASK-1.10 ✅ durum, PHASE-1 tablo, `memory/staging-infra.md` güncelle (network adı `bunker-network`, secret durumu, certbot --expand patern notu), archive, final commit.
>
> **Devam eden GH_TOKEN v2:** `alpfit-deploy-debug-v2` (Actions+Secrets:RW, 7 gün). Closure sonrası **kullanıcı revoke etmeli**.
>
> **Yeni oturumda:** `/devflow:resume` → TASK-1.10.md "Oturum 2026-05-29 #2" bölümünden devam.

## Hızlı Erişim

**Aktif Task:** TASK-1.10 — Staging deploy (shared VPS — docker-compose) ⏸️ Duraklatıldı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** 2026-05-29 — TASK-1.10 ⏸️ Duraklatıldı (oturum #2 sonu, context şişti): Adım 5-10 ✅ (clone+.gitignore drift fix+.env.staging sırlı doldu+bunker keşfi: bunker-network/SAN cert+webroot+deploy-hook+squarespace DNS+certbot --expand 7 domain+nginx server block+reload+ilk deploy: backend healthy, prisma migrate deploy uygulandı, public https://alpfit-staging.kiwiailab.com/healthz 200), Adım 11 auto-deploy: GH Actions secrets bozuk format hatası (ssh.ParsePrivateKey: no key found + DNS lookup trailing newline) → gh CLI ile 3 secret'ı temiz format ile yeniden yazıldı → workflow_dispatch başarılı (8d0f268 sunucuya sync, /healthz 200); kalan: boş commit ile push→CI→workflow_run zincir görsel teyit + TASK closure (doküman/archive); GH_TOKEN v2 (alpfit-deploy-debug-v2) 7 gün aktif — kullanıcı task bitiminde revoke edecek.
