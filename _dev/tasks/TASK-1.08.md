# TASK-1.08: Mobile test altyapısı (Jest + RTL)

**Durum:** ⬜ Bekliyor
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

- [ ] **1. Jest + RTL kurulumu**
  - `pnpm -F @alpfit/mobile add -D jest jest-expo @testing-library/react-native @testing-library/jest-native react-test-renderer @types/jest`
  - `mobile/jest.config.js` — `preset: 'jest-expo'`, `setupFilesAfterEach: ['@testing-library/jest-native/extend-expect']`, transform ignore patterns (Expo modülleri)
  - Dosya: `mobile/jest.config.js`, `mobile/package.json` (deps + scripts)

- [ ] **2. Test setup (global)**
  - `mobile/test/setup.ts` — i18n init wrap helper, react-native mock'ları (gerekirse Expo modülleri için manual mock)
  - `mobile/test/render-with-providers.tsx` — custom render: `<I18nextProvider>` + Expo Router stub + tema provider (gelecekte) wrap'ler
  - Dosya: `mobile/test/setup.ts`, `mobile/test/render-with-providers.tsx`

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
│   └── README.md                    # YENİ
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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
