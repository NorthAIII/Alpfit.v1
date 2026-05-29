# TASK-1.05: Mobile Expo SDK 56 + Expo Router iskelet

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.01

---

## Hedef

`mobile/` workspace'ine Expo SDK 56 + React Native 0.81 (New Architecture) + Expo Router (file-based routing + deep link altyapısı) tabanlı uygulama iskeletini kur. Boş bir "Merhaba Alpfit" landing screen'i + tab navigation slot'u, dev cihazda (iOS simulator + Android emulator) **boot eder**. Sonraki UI task'larının file-based route ekleyebileceği zemini hazırla.

---

## Bağlam

Research-phase Expo SDK 56 (RN 0.81 New Arch) seçti — solo dev + 90 gün + push/deep link kritikliği + tek TypeScript. Expo Router file-based routing (Next.js mantığı) deep link konfigürasyonunu otomatize ediyor — TASK-1.25 ve TASK-1.32'de bunun üzerine `.well-known/` ve `alpfit.app/davet/{kod}` route'ları kurulacak.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §1, §5 (TR Locale Temeli)
- `_dev/phases/PHASE-1.md` — Araştırma → Mobile Stack + Dikkat Edilecekler #2 (New Arch filtresi)
- `_dev/ILKELER.md` §"Kalıcılık önceliği"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Expo SDK 56 + Expo Router + New Arch kararı

---

## Alt Görevler

- [ ] **1. Expo + RN kurulumu (workspace içinde)**
  - `mobile/` klasörüne `pnpm create expo-app .` çalıştırılır (mevcut placeholder'ı override eder); template `with-router`
  - `pnpm -F @alpfit/mobile add expo@~56 react-native@0.81 expo-router expo-linking expo-constants expo-status-bar`
  - `app.json` / `app.config.ts` — `scheme: "alpfit"`, bundle identifier (`app.alpfit.mobile` placeholder), `newArchEnabled: true`
  - Dosya: `mobile/package.json`, `mobile/app.json`, `mobile/app.config.ts`

- [ ] **2. Expo Router file-based routing kurulumu**
  - `mobile/app/_layout.tsx` — root layout (`<Slot />` veya `<Stack />`)
  - `mobile/app/index.tsx` — landing screen: "Merhaba Alpfit" + role-selection placeholder (TASK-1.26'da gerçek içerik gelir)
  - Dosya: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`

- [ ] **3. tsconfig hizalama (TASK-1.01 base ile)**
  - `mobile/tsconfig.json` — `extends: ../tsconfig.base.json`, Expo'nun gerektirdiği overrides (`jsx: "react-jsx"`, `moduleResolution: "bundler"` mobile-only)
  - **Karar notu:** Expo template default tsconfig'i ile TASK-1.01 base'i arasında çatışma varsa mobile override edilir (base mobile'a uymadığı için); aksini değil
  - Dosya: `mobile/tsconfig.json`

- [ ] **4. Babel + Metro config**
  - `mobile/babel.config.js` — `babel-preset-expo`
  - `mobile/metro.config.js` — monorepo support (`watchFolders: [shared/]`, `resolver.nodeModulesPaths`) → pnpm hoist tuzakları için
  - Dosya: `mobile/babel.config.js`, `mobile/metro.config.js`

- [ ] **5. Boot smoke (iOS sim + Android emu)**
  - `pnpm -F @alpfit/mobile exec expo start --ios` → simulator'da "Merhaba Alpfit" yazısı görünür
  - `pnpm -F @alpfit/mobile exec expo start --android` → emulator'da aynısı görünür
  - **Bu task'ta gerçek build (EAS) yok** — sadece dev server boot
  - Sonuç: README'ye boot adımları + olası troubleshooting (Metro cache, pnpm hoist) eklenir
  - Dosya: `mobile/README.md` (kısa boot rehberi)

- [ ] **6. .env baseline + EXPO_PUBLIC_* prefix**
  - `mobile/.env.example` — `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SENTRY_DSN` (TASK-1.12'de aktive)
  - Expo public env convention: client-side bundle'a giren değişkenler `EXPO_PUBLIC_` prefix'i ile
  - Dosya: `mobile/.env.example`

---

## Etkilenen Dosyalar

```
mobile/
├── package.json              # GÜNCELLE
├── app.json                  # YENİ
├── app.config.ts             # YENİ (env aware)
├── babel.config.js           # YENİ
├── metro.config.js           # YENİ
├── tsconfig.json             # GÜNCELLE
├── .env.example              # YENİ
├── README.md                 # YENİ (boot adımları)
├── app/
│   ├── _layout.tsx           # YENİ
│   └── index.tsx             # YENİ
└── assets/                   # YENİ (Expo default — icon, splash placeholder)
```

---

## Dikkat Noktaları

- **pnpm + Expo + Metro tuzağı:** pnpm hoist olmadığı için Metro `node_modules` resolution'da sorun yaşayabilir. `metro.config.js`'de `resolver.nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../node_modules')]` eklenir. Bu pattern community'de yerleşmiş.
- **New Arch (Araştırma §Tuzak #2):** `newArchEnabled: true` set edilir; sonraki paket eklemelerinde "Fabric/TurboModule uyumlu" filtresi uygulanır.
- **Expo Router file-based routing:** Deep link `app.json` `scheme` + `runtime/+native intent` ayarları otomatik üretir; **gerçek Universal/App Link kurulumu TASK-1.25'te** (`.well-known/` + EAS Hosting).
- **iOS simulator yoksa:** macOS gerekiyor; CI yalnızca Android emulator ile smoke yapar (TASK-1.09 + EAS Build TASK-1.16'ya değil — bu fazda gerek yok, Yakın 5'te).
- **mobile/.env'in gerçek halini gitignore'da tut**; `.env.example` repo'da.

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/mobile typecheck` hatasız geçer
- [ ] `pnpm -F @alpfit/mobile lint` hatasız geçer
- [ ] `pnpm -F @alpfit/mobile exec expo start` Metro bundler hata vermeden açılır
- [ ] iOS sim (varsa) + Android emu'da "Merhaba Alpfit" görünür
- [ ] `app.json` scheme `alpfit` ve `newArchEnabled: true` doğrulanır
- [ ] Mobile + backend aynı anda `pnpm dev` ile başlar (concurrently veya ayrı terminaller — script seçimi sade kalır)

---

## Karar Noktaları

- **Bundle identifier şu an mı sabit:** `app.alpfit.mobile` placeholder yeterli; Yakın 5'te App Store / Play Store hesabı açılırken kesin değer EAS configuration'a girer. Bu task'ta placeholder.
- **Splash + icon assets:** Expo template default placeholders kullan; gerçek brand asset'leri Yakın 5 launch öncesi tasarımla gelir.

---

## Risk ve Geri Dönüş Planı

- **Risk:** pnpm + Metro çatışması Expo dev start'ı bozarsa.
  - **Mitigation:** `metro.config.js` hoist konfigürasyonu standart pattern; fallback olarak `pnpm install --shamefully-hoist` mobile workspace'i için lokal hoist (son çare, lockfile'ı korur).
- **Risk:** Expo SDK 56 üçüncü-parti paket uyumsuzluğu (örn. RN 0.81 + bir paketin eski Native Module sürümü).
  - **Mitigation:** Bu task'ta minimum paket; uyumsuzluk sonraki UI task'larında çıkarsa Expo SDK upgrade matrix'ine bakılır.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.05): scaffold expo sdk 56 mobile with file-based router`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Expo SDK 56 + Expo Router + New Arch + pnpm/Metro pattern kararı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
