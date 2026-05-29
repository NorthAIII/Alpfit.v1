# TASK-1.08: Mobile test altyapısı (Jest + RTL)

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.05, TASK-1.07

---

## Hedef

Mobile workspace'ine Jest + React Native Testing Library (RTL) kur — component testleri için `@testing-library/react-native`, snapshot için `react-test-renderer`, Expo modüllerini mock'lamak için `jest-expo` preset. İlk component test'ini (i18n provider içinde landing screen render testi) yaz ve yeşilden geçir. E2E (Maestro) Yakın 5'te; bu task component-level kapsamı kurar.

---

## Bağlam

Research-phase mobile için Jest + RTL seçti (E2E Maestro Yakın 5'te). Discuss-phase test stratejisi: mobile component test (UI elemanları izole) + smoke test (3-5 kritik akış). [[ilkeler]] §"Kümülatif test altyapısı" — UI task'larının (TASK-1.26..1.34) her biri bu altyapı üzerine test ekleyecek.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §6 (Test Altyapısı)
- `_dev/phases/PHASE-1.md` — Araştırma → Test Framework
- `_dev/ILKELER.md` §"Kümülatif test altyapısı"
- `_dev/QUALITY.md` §6 (Test Kapsamı)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. Jest + RTL + MSW kurulumu**
  - `pnpm -F @alpfit/mobile add -D jest jest-expo @testing-library/react-native @testing-library/jest-native react-test-renderer @types/jest msw whatwg-fetch`
  - `mobile/jest.config.js` — `preset: 'jest-expo'`, `setupFilesAfterEach: ['@testing-library/jest-native/extend-expect']`, transform ignore patterns (Expo modülleri)
  - Dosya: `mobile/jest.config.js`, `mobile/package.json` (deps + scripts)

- [ ] **2. Test setup (global)**
  - `mobile/test/setup.ts` — i18n init wrap helper, react-native mock'ları (gerekirse Expo modülleri için manual mock), MSW server start/stop hooks (beforeAll/afterEach/afterAll)
  - `mobile/test/render-with-providers.tsx` — custom render: `<I18nextProvider>` + Expo Router stub + tema provider (gelecekte) wrap'ler
  - `mobile/test/msw/server.ts` — `setupServer(...handlers)` Node Server instance
  - `mobile/test/msw/handlers.ts` — boş default handler dizisi (sonraki UI task'ları kendi handler'larını ekler — pattern bu task'ta kurulur)
  - `mobile/test/msw/README.md` — handler ekleme pattern'i (yeni UI task → kendi handler dosyası → suite-level `server.use(...)` ile inject)
  - Dosya: `mobile/test/setup.ts`, `mobile/test/render-with-providers.tsx`, `mobile/test/msw/*`

- [ ] **3. İlk component testi: landing screen**
  - `mobile/app/index.test.tsx` — `<Index />` render edildiğinde "Merhaba Alpfit" string'i (i18n key'inden) DOM'da görünür
  - Snapshot test (basit, refactor güvencesi)
  - Dosya: `mobile/app/index.test.tsx`

- [ ] **4. Test script'leri**
  - `mobile/package.json`: `"test": "jest"`, `"test:watch": "jest --watch"`, `"test:coverage": "jest --coverage"`
  - Coverage threshold şu an YOK (review-phase'de karar)
  - Dosya: `mobile/package.json` (UPDATE)

- [ ] **5. i18n test pattern dokümante**
  - `mobile/test/README.md` — yeni component test yazarken `renderWithProviders()` kullanım örneği, i18n key assertion pattern'i
  - Dosya: `mobile/test/README.md`

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                     # GÜNCELLE
├── jest.config.js                   # YENİ
├── test/
│   ├── setup.ts                     # YENİ
│   ├── render-with-providers.tsx    # YENİ
│   ├── README.md                    # YENİ
│   └── msw/
│       ├── server.ts                # YENİ
│       ├── handlers.ts              # YENİ
│       └── README.md                # YENİ
└── app/
    └── index.test.tsx               # YENİ
```

---

## Dikkat Noktaları

- **jest-expo preset Expo modüllerini transforms eder** — manuel babel config'e gerek yok; ama `transformIgnorePatterns` bazen aşırı agresif olur, problem çıkarsa whitelist eklenir.
- **Expo Router stub:** `expo-router`'ın `useRouter`, `Link` gibi API'lerini test'te mock'lamak gerekir. Helper'da pattern kurulur.
- **i18n init test'te kritik:** `renderWithProviders` her test'te i18n instance'ı initialize eder; eksik anahtar testleri kırmasın diye `missingKeyHandler` test'te `warn` (throw değil) seviyesine alınır.
- **CI'da Jest çalışır** (TASK-1.09'da entegre); local'de `pnpm -F mobile test` yeterli.
- **Vitest neden değil?** Mobile'da `react-native` runtime + jest-expo preset olgun ekosistem — Vitest RN için henüz olgun değil. Hybrid setup (backend Vitest, mobile Jest) bilinçli (Araştırma kararı).

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/mobile test` çalışır, landing screen testi PASS
- [ ] Snapshot dosyası `__snapshots__/index.test.tsx.snap` üretilir, git'e eklenir
- [ ] `renderWithProviders` helper i18n provider ile çalışır, `getByText('Merhaba Alpfit')` veya i18n key'in TR karşılığı bulunur
- [ ] Coverage report `coverage/lcov.info` üretilir, gitignore'da
- [ ] Test çalıştırıldığında i18n eksik anahtar warning'i throw etmez (test mode'da `warn`)

---

## Karar Noktaları

- **Snapshot policy:** Snapshot test'leri refactor güvencesi sağlar ama "snapshot updated" PR'ları sinyali bozar. Pattern: kritik componentler için snapshot, sade UI için query-based (`getByText`, `getByRole`). → Karar dokümante et, sonraki UI task'larında uygula.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.08): set up jest with rtl for mobile component tests`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-29

**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Paketler:** `jest@^29.7.0`, `jest-expo@~56.0.4` (bundledNativeModules ile çapraz doğrulanmış), `@testing-library/react-native@^13.3.3`, `react-test-renderer@19.2.6` (React 19.2.6 ile pin), `@react-native/jest-preset@^0.85.3` (jest-expo peer), `msw@^2.14.6`, `whatwg-fetch@^3.6.20`, `@types/jest@^29.5.14` mobile devDeps'e eklendi. Kullanıcı onayıyla deprecated `@testing-library/jest-native` paketi atlandı; modern RTL v13 matchers (`@testing-library/react-native/matchers` + `expect.extend`) seçildi.
- **Jest config (`mobile/jest.config.js`):** `preset: 'jest-expo/ios'` — universal multi-project preset'in 4 platform × test koşumu yerine tek platform (component'lerimiz platform-agnostic; UI task'larında ihtiyaç olursa universal'a geçilir). `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']` (Jest doğru option adı `setupFilesAfterEnv`, `setupFilesAfterEach` değil). MSW v2 conditional exports için `testEnvironmentOptions.customExportConditions: ['node', 'node-addons']`. Rettime ESM zinciri için `.mjs` transform babel-jest'e açıldı. `transformIgnorePatterns` daraltıldı — yalnız `react-native-reanimated/plugin/` + `@react-native/babel-preset/` ignore; kalan node_modules transform edilir (jest-expo'nun karmaşık iç-içe `.pnpm/<pkg>/node_modules/<pkg>` whitelist'inde MSW deps ve expo-modules-core/src yakalanıyordu). `moduleNameMapper`: `.js→.ts` shim + `@alpfit/shared` workspace path.
- **Test altyapısı dosyaları:** `mobile/test/setup.ts` — matchers + MSW server lifecycle (beforeAll/afterEach/afterAll) + `NODE_ENV=test` (i18n missing-key warn'a düşer, throw değil). `mobile/test/render-with-providers.tsx` — `I18nextProvider` wrap'leyen custom render. `mobile/test/msw/{server.ts,handlers.ts,README.md}` — boş default handlers + suite-level `server.use(...)` pattern + KVKK koruması olarak `onUnhandledRequest: 'error'`. `mobile/test/README.md` — i18n pattern, snapshot policy, coverage notu.
- **Test dosyası konumu (önemli karar):** `mobile/__tests__/landing-screen.test.tsx` — jest-expo snapshot resolver path'te `__tests__/` substring'i `__tests__/__snapshots__/`'a replace eder. Test app/ klasöründe olursa (a) snapshot dosyası path'i bozulur (b) Expo Router scan'i `.test.tsx`'i route + import'larını bundle'a alır (`pnpm export:smoke` fail). Mobile root altında `__tests__/` her iki problemi çözer.
- **Scripts + tsconfig + eslint:** `mobile/package.json`'a `test/test:watch/test:coverage`; `mobile/tsconfig.json` `types: [...'jest']` + include `__tests__/**/*` + `test/**/*`; `eslint.config.mjs` CommonJS allowlist'ine `jest.config.js` eklendi.

**Snapshot Policy (karar dokümante):** Kritik component'ler (banner stack, motor karar UI, ölçüm formu) için snapshot — refactor güvencesi. Sade/dinamik UI için query-based assertion (`getByText`, `getByRole`). Snapshot'lar git'e commit edilir. Detay: `mobile/test/README.md`.

**Test Kriterleri:**
- ✅ `pnpm -F @alpfit/mobile test` 2 passed (TR text query + snapshot match, 0.95s)
- ✅ `mobile/__tests__/__snapshots__/landing-screen.test.tsx.snap.ios` üretildi + git'e eklendi
- ✅ `renderWithProviders` i18n provider ile çalışıyor — `getByText('Merhaba Alpfit')` ve `formatTrDate(new Date())` interpolation TR çıktısı bulundu
- ✅ Coverage path konfigüre (collectCoverageFrom + coverage/ gitignored — root `.gitignore`'da)
- ✅ i18n missing-key warn moduna alındı (`NODE_ENV=test`)
- ✅ `pnpm typecheck` 3 paket temiz, `pnpm lint` temiz, `pnpm format:check` temiz
- ✅ `pnpm test` recursive 52 passed (41 shared + 9 backend + 2 mobile)
- ✅ `pnpm -F @alpfit/mobile run export:smoke` 1.7MB web bundle (regression yok)

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29
