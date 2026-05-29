# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.08 ✅: Jest 29.7 + jest-expo/ios + RTL 13.3.3 modern matchers + MSW 2.14.6 + react-test-renderer 19.2.6 mobile workspace'e kuruldu; mobile/__tests__/landing-screen.test.tsx 2 test PASS (TR text query + snapshot); jest-expo snapshot resolver `__tests__/` pattern uyumu için test app/ dışına taşındı; 52 test passed (41 shared + 9 backend + 2 mobile); sıradaki TASK-1.09.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 8/34 task — TASK-1.08 tamamlandı; sıradaki adım `/devflow:run-task` ile TASK-1.09 (CI PR pipeline)
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

**Task:** TASK-1.09 — CI PR pipeline (GitHub Actions: test + lint + typecheck)
**Durum:** ⬜ Bekliyor
**İlerleme:** Bir sonraki oturumda `/devflow:run-task` ile çalıştırılacak.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 8 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.09–1.16 | M0 Altyapı (CI, hosting, Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (8) |
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

### TASK-1.08 — Mobile test altyapısı (Jest + RTL) (2026-05-29) ✅

- **Paketler:** `bundledNativeModules.json` ile çapraz doğrulanıp `jest@^29.7.0` + `jest-expo@~56.0.4` + `@testing-library/react-native@^13.3.3` + `react-test-renderer@19.2.6` (React 19.2.6 ile pin) + `@react-native/jest-preset@^0.85.3` (jest-expo peer) + `msw@^2.14.6` + `whatwg-fetch@^3.6.20` + `@types/jest@^29.5.14` mobile devDeps'e eklendi. Modern RTL matchers seçildi (kullanıcı onayı) — deprecated `@testing-library/jest-native` paketi alınmadı; `expect.extend(require('@testing-library/react-native/matchers'))` ile aktive edildi.
- **Jest config (`mobile/jest.config.js`):** `preset: 'jest-expo/ios'` tek-platform (universal multi-project'in 4× koşum süresini engeller); `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']`; MSW v2 conditional export'ları için `testEnvironmentOptions.customExportConditions: ['node', 'node-addons']`; `.mjs` transform'u babel-jest'e açıldı (rettime ESM zinciri); `transformIgnorePatterns` daraltıldı (sadece `react-native-reanimated/plugin/` + `@react-native/babel-preset/` ignore; geri kalan node_modules transform edilir — jest-expo'nun karmaşık iç-içe `.pnpm/<pkg>/node_modules/<pkg>` whitelist'inde MSW deps ve expo-modules-core/src yakalanıyordu); `moduleNameMapper` `.js→.ts` shim + `@alpfit/shared` workspace path.
- **Test altyapısı dosyaları:** `mobile/test/setup.ts` (matchers + MSW server lifecycle beforeAll/afterEach/afterAll + `NODE_ENV=test`); `mobile/test/render-with-providers.tsx` (custom render: `I18nextProvider` wrap); `mobile/test/msw/{server.ts,handlers.ts,README.md}` (boş default handlers; suite-level `server.use(...)` pattern + KVKK koruması olarak `onUnhandledRequest: 'error'`); `mobile/test/README.md` (i18n pattern, snapshot policy, coverage notu). Test'ler `mobile/__tests__/landing-screen.test.tsx` — jest-expo snapshot resolver `__tests__/` substring'i `__snapshots__/`'a replace eder, bu yüzden test app/ dışına taşındı (Expo Router scan etmez + snapshot path uyumlu); snapshot dosyası `__tests__/__snapshots__/landing-screen.test.tsx.snap.ios`.
- **Scripts + tsconfig + eslint:** `mobile/package.json`'a `test/test:watch/test:coverage`; `mobile/tsconfig.json` `types: [...'jest']` + include `__tests__/**/*` + `test/**/*`; `eslint.config.mjs` CommonJS allowlist'ine `jest.config.js` eklendi (require/module/__dirname).
- Test kriterleri ✅ — `pnpm -F @alpfit/mobile test` 2 passed (`Merhaba Alpfit` text query + snapshot match, 0.95s), `pnpm typecheck` 3 paket temiz, `pnpm lint` temiz, `pnpm format:check` temiz, `pnpm test` recursive 52 passed (41 shared + 9 backend + 2 mobile), `pnpm -F @alpfit/mobile run export:smoke` 1.7MB web bundle (regression yok).

### TASK-1.07 — i18n shell (i18next mobile + backend, TR-only) (2026-05-29) ✅

- **Paketler:** Expo SDK 56 `bundledNativeModules.json` ile çapraz doğrulayıp `i18next@^26.3.0` + `react-i18next@^17.0.8` (peer `i18next >= 26.2.0`) + `expo-localization@~56.0.6` mobile'a, `i18next@^26.3.0` backend'e eklendi. **Mobile init** (`mobile/src/i18n/index.ts`) `initReactI18next` ile `defaultNS: 'common'`, 5 namespace (common/auth/errors/kvkk/profile), `lng/fallbackLng/supportedLngs: 'tr'`, `react.useSuspense: false`. **Backend init** (`backend/src/i18n/index.ts`) `i18next.createInstance()` izole instance + `defaultNS: 'errors'`, 3 namespace (sms/errors/notifications). JSON'lar backend'de `fs.readFileSync + fileURLToPath(import.meta.url)` ile yüklendi — NodeNext ESM import attribute davranışından bağımsız.
- **TR Resource:** Mobile 5 JSON (~30 anahtar; landing/actions/states + onboarding placeholder + errors + KVKK `[Hukuki review bekliyor — Yakın 5 öncesi yerleşecek]` + profile delete-account warning), Backend 3 JSON (sms.otp `"Alpfit doğrulama kodun: {{code}}. 5 dakika geçerli."`, errors.auth.{otpInvalid,tokenExpired,…}, notifications.comeback.{t2,t7,t14}). TR karakter (ş, ğ, ı, ç, İ) UTF-8 ile saklandı, test düzeyinde `doğrulama` / `Oturumun` ile doğrulandı.
- **Dev throw / Type-safe:** Her iki taraf `process.env['NODE_ENV'] !== 'production'` ⇒ `saveMissing: true` + `missingKeyHandler` throw (mobile prod fallback'i `console.warn`; Sentry hook TASK-1.11/1.12'de). `mobile/i18next.d.ts` + `backend/src/i18n/i18next.d.ts` `declare module 'i18next' { interface CustomTypeOptions { resources: typeof import(...) } }` pattern ile typesafe — `t('sms:nonexistent.key')` typecheck fail (geçici `__i18n_typesafe_smoke.ts` + `@ts-expect-error` ile doğrulandı). **Backend `t` cast:** `instance.t.bind(instance) as I18nInstance['t']` — `.bind()` aksi halde overload signature'larını düşürüp namespace:key kontrolünü kaybediyordu.
- Test kriterleri ✅ — `pnpm typecheck` 3 paket temiz, `pnpm test` 50 passed (41 shared 0.68s + 9 backend 1.43s; 6 yeni i18n test: init + sms.otp interpolation + sms.inviteWelcome multi-variable + errors.auth.otpInvalid + TR karakter + dev throw), `pnpm lint` temiz, `pnpm format:check` temiz, `pnpm -F @alpfit/mobile run export:smoke` 1221 modül 1.7MB web bundle (i18n provider + useTranslation chain Metro tarafından çözüldü).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

<!-- Bu bölüm sadece /devflow:pause kullanıldığında doldurulur. Devam edildiğinde silinir. -->

> ⏸️ **Duraklatma yok** — Aktif çalışma devam ediyor.

## Hızlı Erişim

**Aktif Task:** TASK-1.09 — CI PR pipeline (GitHub Actions: test + lint + typecheck)
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** 2026-05-29 — TASK-1.08 ✅: Jest 29.7 + jest-expo/ios + RTL 13.3.3 modern matchers + MSW 2.14.6 + react-test-renderer 19.2.6 mobile workspace'e kuruldu; mobile/__tests__/landing-screen.test.tsx 2 test PASS (TR text query + snapshot); jest-expo snapshot resolver `__tests__/` pattern uyumu için test app/ dışına taşındı; 52 test passed (41 shared + 9 backend + 2 mobile); sıradaki TASK-1.09.
