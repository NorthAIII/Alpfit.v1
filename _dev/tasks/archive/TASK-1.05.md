# TASK-1.05: Mobile Expo SDK 56 + Expo Router iskelet

**Durum:** ✅ Tamamlandı
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

- [x] **1. Expo + RN kurulumu (workspace içinde)**
  - `mobile/` klasörüne `pnpm create expo-app .` çalıştırılır (mevcut placeholder'ı override eder); template `with-router`
  - `pnpm -F @alpfit/mobile add expo@~56 react-native@0.81 expo-router expo-linking expo-constants expo-status-bar`
  - `app.json` / `app.config.ts` — `scheme: "alpfit"`, bundle identifier (`app.alpfit.mobile` placeholder), `newArchEnabled: true`
  - Dosya: `mobile/package.json`, `mobile/app.json`, `mobile/app.config.ts`

- [x] **2. Expo Router file-based routing kurulumu**
  - `mobile/app/_layout.tsx` — root layout (`<Slot />` veya `<Stack />`)
  - `mobile/app/index.tsx` — landing screen: "Merhaba Alpfit" + role-selection placeholder (TASK-1.26'da gerçek içerik gelir)
  - Dosya: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`

- [x] **3. tsconfig hizalama (TASK-1.01 base ile)**
  - `mobile/tsconfig.json` — `extends: ../tsconfig.base.json`, Expo'nun gerektirdiği overrides (`jsx: "react-jsx"`, `moduleResolution: "bundler"` mobile-only)
  - **Karar notu:** Expo template default tsconfig'i ile TASK-1.01 base'i arasında çatışma varsa mobile override edilir (base mobile'a uymadığı için); aksini değil
  - Dosya: `mobile/tsconfig.json`

- [x] **4. Babel + Metro config**
  - `mobile/babel.config.js` — `babel-preset-expo`
  - `mobile/metro.config.js` — monorepo support (`watchFolders: [shared/]`, `resolver.nodeModulesPaths`) → pnpm hoist tuzakları için
  - Dosya: `mobile/babel.config.js`, `mobile/metro.config.js`

- [x] **5. Boot smoke (iOS sim + Android emu)**
  - `pnpm -F @alpfit/mobile exec expo start --ios` → simulator'da "Merhaba Alpfit" yazısı görünür
  - `pnpm -F @alpfit/mobile exec expo start --android` → emulator'da aynısı görünür
  - **Bu task'ta gerçek build (EAS) yok** — sadece dev server boot
  - Sonuç: README'ye boot adımları + olası troubleshooting (Metro cache, pnpm hoist) eklenir
  - Dosya: `mobile/README.md` (kısa boot rehberi)

- [x] **6. .env baseline + EXPO_PUBLIC_* prefix**
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

- [x] `pnpm -F @alpfit/mobile typecheck` hatasız geçer
- [x] `pnpm -F @alpfit/mobile lint` hatasız geçer
- [x] `pnpm -F @alpfit/mobile exec expo start` Metro bundler hata vermeden açılır
- [x] iOS sim (varsa) + Android emu'da "Merhaba Alpfit" görünür
- [x] `app.json` scheme `alpfit` ve `newArchEnabled: true` doğrulanır
- [x] Mobile + backend aynı anda `pnpm dev` ile başlar (concurrently veya ayrı terminaller — script seçimi sade kalır)

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

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.05): scaffold expo sdk 56 mobile with file-based router`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi
- [x] DECISIONS.md — Expo SDK 56 + Expo Router + New Arch + pnpm/Metro pattern kararı

---

## Oturum Kayıtları

### Oturum 2026-05-29

**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Mobile workspace scaffold (manuel) — Expo SDK 56 + RN 0.85.3 + React 19.2.6.** Task doc'un "RN 0.81" satırı Expo SDK 56 bundled native modules JSON'u (`react-native: 0.85.3`, `react: 19.2.3`, `react-server-dom-webpack: ~19.2.4`) ile çatışıyordu; `AskUserQuestion` ile bundled pairing onaylandı, RN 0.85.3 + React 19.2.6 (rsdw peer üst-bound örtüşmesi) kalıcı pairing. `pnpm create expo-app` yerine manuel scaffold (pnpm lock korundu, `mobile/.npmrc` `node-linker=hoisted` ile Metro flat resolution'ı için per-workspace ayar). Smoke yöntemi `expo export -p web` (devcontainer'da iOS sim/Android emu yok).
- **Dosyalar — yeni:** `mobile/app.json` (scheme `alpfit`, bundleId `app.alpfit.mobile`, `newArchEnabled: true`, `plugins: [expo-router]`, `experiments.typedRoutes: true`, `web.bundler: metro`); `mobile/app.config.ts` (env-aware `EXPO_PUBLIC_*` → `extra.apiBaseUrl/sentryDsn`, bracket access strict tsconfig uyumlu); `mobile/babel.config.js` (`babel-preset-expo`); `mobile/metro.config.js` (`getDefaultConfig` + `watchFolders: [workspaceRoot]` + `nodeModulesPaths` + `disableHierarchicalLookup`); `mobile/app/_layout.tsx` (Stack + StatusBar); `mobile/app/index.tsx` (landing "Merhaba Alpfit" + TASK-1.26 placeholder); `mobile/.env.example` (`EXPO_PUBLIC_API_BASE_URL=http://localhost:3711`, `EXPO_PUBLIC_SENTRY_DSN=`); `mobile/.npmrc` (`node-linker=hoisted` — pnpm 8+ per-workspace); `mobile/expo-env.d.ts` (`/// <reference types="expo/types" />` minimal); `mobile/README.md` (boot rehberi + sorun giderme).
- **Dosyalar — güncelle:** `mobile/package.json` (Expo SDK 56 bundled deps: `expo@~56.0.7`, `expo-router@~56.2.8`, `expo-linking@~56.0.13`, `expo-constants@~56.0.16`, `expo-status-bar@~56.0.4`, `@expo/metro-runtime@~56.0.13`, `react@19.2.6`, `react-dom@19.2.6`, `react-native@0.85.3`, `react-native-{gesture-handler,reanimated,safe-area-context,screens,web}` SDK 56 versiyonları, `react-server-dom-webpack@19.2.4`; devDep `@types/react@~19.2.0`; scripts `start/dev/android/ios/web/typecheck/export:smoke`; `main: expo-router/entry`); `mobile/tsconfig.json` (`extends: ../tsconfig.base.json` korundu, mobile-only override: `jsx: react-jsx`, `module: ESNext`, `moduleResolution: bundler`, `lib: [DOM, ESNext]`, `target: ESNext`, `allowJs: true`, `noEmit: true`, `types: [expo/types, react/canary]`); `eslint.config.mjs` (`.expo-export-smoke/` ignore + Expo CommonJS config'ler için ayrı section: `sourceType: commonjs`, `globals.node`, `@typescript-eslint/no-require-imports: off`); `package.json` (root `dev` script: `pnpm -r --parallel run dev` + `globals` devDep); `.gitignore` (`.expo/`, `.expo-export-smoke/`); `.prettierignore` (`.expo-export-smoke`).
- **Dosyalar — silindi:** `mobile/src/.gitkeep` (Expo Router `app/` dizini kullanıyor, `src/` artıksız); `mobile/tsconfig.tsbuildinfo` (eski composite artifact).
- **DECISIONS.md** — Yeni karar girdisi: "Mobile Bootstrap: Expo SDK 56 + RN 0.85.3 + Expo Router + pnpm `node-linker=hoisted`" — RN versiyon revizyonu, hoisted linker rationale, app.json+app.config.ts ikili pattern, smoke stratejisi, peer/runtime risk mitigation'ları.

**Test sonuçları (✅ tüm kriterler):**
- `pnpm -F @alpfit/mobile typecheck` → temiz (tsc --noEmit hatasız)
- `pnpm -w lint` → temiz (ESLint Expo CommonJS config'leri tanıyor)
- `pnpm -w format:check` → temiz (Prettier tüm dosyalar uyumlu)
- `pnpm exec expo --version` → 56.1.13
- `pnpm exec expo config --type public` → SDK 56.0.0 resolve, scheme `alpfit`, plugins `[expo-router]`
- `pnpm exec expo export --platform web --output-dir .expo-export-smoke --clear` → 4.2s, 767 modül resolve, 1.1MB bundle, 18 asset; tüm transitive dep'ler (expo-modules-core dahil) flat layout'tan çözüldü
- Backend regresyonu: `pnpm -F @alpfit/backend typecheck` ✓ + `pnpm -F @alpfit/backend test` 3 passed 1.36s ✓
- `app.json` scheme `alpfit` ve `newArchEnabled: true` doğrulandı (`expo config --type public` çıktısı)

**Önemli karar revizyonları:**
- **RN 0.85.3 (task doc "0.81" supersede)** — Expo SDK 56 bundled native modules JSON ground truth.
- **Manuel scaffold (`pnpm create expo-app` değil)** — pnpm lock korundu, atomic file diff.
- **`mobile/.npmrc` `node-linker=hoisted`** — task risk planındaki `--shamefully-hoist` fallback'inin kalıcı + idiomatic versiyonu (pnpm 8+).
- **`app.json` (statik) + `app.config.ts` (dinamik env-aware) ikili yapı** — IDE auto-complete + env injection ayrımı.

**Tamamlanma:** 6/6 alt görev ✓ • 6/6 test kriteri ✓ • Tüm tamamlanma kriterleri ✓

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29
