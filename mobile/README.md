# @alpfit/mobile

Expo SDK 56 + React Native 0.85.3 (New Architecture) + Expo Router file-based routing.

## Boot (Dev)

```bash
# Workspace kökünden — tüm bağımlılıkları kur
pnpm install

# Mobile dev server (Metro bundler)
pnpm -F @alpfit/mobile dev          # eşdeğeri: expo start

# Platform kısayolları (simulator/emulator gerekir)
pnpm -F @alpfit/mobile ios
pnpm -F @alpfit/mobile android
pnpm -F @alpfit/mobile web
```

Devcontainer'da iOS sim / Android emu yoktur — Yakın 5 (UAT) öncesi gerçek
cihaz build'leri EAS Build üzerinden yapılır. Devcontainer içinde doğrulama:

```bash
# Type + lint
pnpm -F @alpfit/mobile typecheck
pnpm -w lint

# Metro bundle smoke (web hedefi; cihazsız doğrulama)
pnpm -F @alpfit/mobile export:smoke
```

## Backend ile Birlikte

```bash
# Kökten paralel iki workspace dev (ayrı terminaller veya pnpm -r --parallel)
pnpm -r --parallel run dev
```

`EXPO_PUBLIC_API_BASE_URL` mobile'ın backend'e bağlandığı host'u taşır;
varsayılan `http://localhost:3711` (backend healthz portu).

## Sorun Giderme

- **Metro "unable to resolve" + pnpm:** `metro.config.js` watchFolders =
  workspace root + `disableHierarchicalLookup` kurulu. Yeni shared paket
  eklerken Metro cache'i temizle: `pnpm -F @alpfit/mobile exec expo start -c`.
- **Peer dep warning'leri:** Expo SDK 56 bundled native modules ile peer
  uyumu garanti edildi (`expo install` yerine package.json elle pinlendi).
  Yeni paket eklerken `expo install <pkg>` kullan — SDK 56 uyumlu versiyonu
  o seçer.
- **New Architecture (Fabric / TurboModules):** SDK 56'da default. Üçüncü
  parti paket eklerken README'de "New Architecture supported" doğrula
  (PHASE-1 §Araştırma Tuzaklar #2).

## Dizin Yapısı

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root Stack layout
│   └── index.tsx           # Landing screen ("Merhaba Alpfit")
├── app.json                # Expo static config (scheme, bundleId, plugins)
├── app.config.ts           # Env-aware override (EXPO_PUBLIC_* okur)
├── babel.config.js         # babel-preset-expo
├── metro.config.js         # Monorepo-aware Metro resolver
├── tsconfig.json           # ../tsconfig.base.json + Expo overrides
└── expo-env.d.ts           # Expo type references
```

`assets/` (icon + splash) bu fazda yok — Expo default placeholder'ları
kullanılır. Brand asset'leri Yakın 5 launch öncesi tasarımla gelir.
