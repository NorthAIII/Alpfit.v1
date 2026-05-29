# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.04 ✅: Vitest 4 + per-suite Postgres DB izolasyonu (Testcontainers'tan revize — devcontainer'da Docker yok); test/setup+db+build-test-server helper'lar; /healthz integration testi 200/up + 503/down; 3 test passed 1.37s; coverage 71% lines; sıradaki TASK-1.05.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 5/34 task — TASK-1.05 tamamlandı; sıradaki adım `/devflow:run-task` ile TASK-1.06 (TR locale util + lint kuralı)
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

**Task:** TASK-1.06 — TR locale util + lint kuralı (toLowerCase yasağı)
**Durum:** ⬜ Bekliyor
**İlerleme:** Bir sonraki oturumda `/devflow:run-task` ile çalıştırılacak.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 5 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03 | Prisma 7 + adapter-pg + ilk migration + generate smoke | ✅ Tamamlandı |
| 1.04 | Backend test altyapısı (Vitest + per-suite Postgres) | ✅ Tamamlandı |
| 1.05 | Mobile Expo SDK 56 + Expo Router iskelet | ✅ Tamamlandı |
| 1.06–1.16 | M0 Altyapı (TR locale, i18n, mobile test, CI, hosting, Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (11) |
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

### TASK-1.05 — Mobile Expo SDK 56 + Expo Router iskelet (2026-05-29) ✅

- Expo SDK 56 (`~56.0.7`) + React Native **0.85.3** + React 19.2.6 + Expo Router (`~56.2.8`) + file-based routing kuruldu. **RN versiyon revizyonu:** task doc'un "RN 0.81" satırı Expo SDK 56 bundled native modules JSON ile çatışıyordu (`AskUserQuestion` ile bundled pairing onaylandı, DECISIONS girdisi). `pnpm create expo-app` yerine manuel scaffold (pnpm lock korundu); peer warnings için `react-server-dom-webpack` exact `19.2.4` + `@types/react ~19.2.0`.
- **Dosyalar (yeni):** `mobile/app.json` (scheme `alpfit`, bundleId `app.alpfit.mobile`, `newArchEnabled: true`, plugins `[expo-router]`, `experiments.typedRoutes: true`, `web.bundler: metro`); `mobile/app.config.ts` (`EXPO_PUBLIC_*` env-aware bracket access — strict tsconfig uyumlu); `mobile/babel.config.js` (`babel-preset-expo`); `mobile/metro.config.js` (`watchFolders: [workspaceRoot]` + `nodeModulesPaths` + `disableHierarchicalLookup`); `mobile/app/_layout.tsx` (Stack + StatusBar); `mobile/app/index.tsx` (landing "Merhaba Alpfit" placeholder); `mobile/.env.example`; `mobile/.npmrc` (`node-linker=hoisted` — pnpm 8+ per-workspace, Metro flat resolution); `mobile/expo-env.d.ts`; `mobile/README.md`. **Güncelle:** `mobile/tsconfig.json` (extends base + mobile-only `jsx/module/moduleResolution/lib/target` override); `eslint.config.mjs` (Expo CommonJS config'leri için ayrı section + `.expo-export-smoke/` ignore); root `package.json` (`dev` script + `globals` devDep); `.gitignore`+`.prettierignore`.
- Test kriterleri ✅ — `expo --version` 56.1.13, `expo config --type public` SDK 56.0.0 + scheme `alpfit` resolve; `expo export -p web` 4.2s 767 modül 1.1MB bundle (transitive `expo-modules-core` flat hoisted layout'tan çözüldü); typecheck/lint/format temiz; backend regresyonsuz (3 test passed 1.36s); DECISIONS.md yeni karar girdisi (RN versiyon revizyonu + hoisted linker rationale + smoke stratejisi)

### TASK-1.04 — Backend test altyapısı (Vitest + per-suite Postgres) (2026-05-29) ✅

- Vitest 4.1.7 + @vitest/coverage-v8 kuruldu (testcontainers paketi kurulmadı — devcontainer'da Docker yok). DB izolasyonu **Testcontainers'tan per-suite Postgres'e revize edildi** (`AskUserQuestion` ile onaylı): `test/db.ts` `pg.Client` admin → `CREATE DATABASE alpfit_test_<12hex>` + `execSync('prisma migrate deploy')` + `DROP ... WITH (FORCE)`. `test/setup.ts` `vi.stubEnv` baseline env; `test/build-test-server.ts` `buildServer({ env, logger: false, prisma })` Fastify `.inject()` paterni. DECISIONS.md yeni karar girdisi.
- `src/routes/healthz.test.ts` iki describe: DB reachable → 200/ok/up + DATABASE_URL stub assertion (production DB'ye dokunmuyor) + ISO timestamp parse; DB unreachable (`alpfit-no-such-host?connect_timeout=2`) → 503/degraded/down. `tsconfig.test.json` ayrı (rootDir `.`, noEmit, test/+vitest.config dahil); ana tsconfig `exclude: src/**/*.test.ts`; typecheck script ikisini sırayla çağırıyor. package.json `test`/`test:watch`/`test:coverage` scripts + `pretest: db:generate`; `.gitignore` `/coverage` eklendi.
- Test kriterleri ✅ — `pnpm test` 3 passed 1.37s, `coverage/lcov.info` üretildi (71% lines, 100% routes/healthz), `psql` post-run check 0 DB sızıntısı, typecheck/lint/format temiz; üst Testcontainers kararı yalnızca araç boyutunda supersede (Vitest seçimi korundu)

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

<!-- Bu bölüm sadece /devflow:pause kullanıldığında doldurulur. Devam edildiğinde silinir. -->

> ⏸️ **Duraklatma yok** — Aktif çalışma devam ediyor.

## Hızlı Erişim

**Aktif Task:** TASK-1.06 — TR locale util + lint kuralı (toLowerCase yasağı)
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** 2026-05-29 — TASK-1.05 ✅: Mobile Expo SDK 56 + Expo Router iskelet (RN 0.85.3 + React 19.2.6 bundled — task doc'un "0.81" revize edildi); pnpm `node-linker=hoisted` (Metro flat resolution); app.json+app.config.ts+_layout+landing+babel/metro+.npmrc+expo-env+README; web bundle smoke 767 modül 1.1MB 4.2s; typecheck/lint/format temiz; backend regresyonsuz; sıradaki TASK-1.06.
