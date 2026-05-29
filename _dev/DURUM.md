# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.06 ✅: `@alpfit/shared` TR locale util (trLower/trUpper + parseTrPhone/formatTrPhone/validateTrPhone + formatTrDate{,Short,Time,Time}); ESLint `no-restricted-syntax` ham `.toLowerCase()/.toUpperCase()` yasağı; mobile Metro `.js→.ts` shim + `shared/node_modules` path; backend pretypecheck shared rebuild; 44 test passed (41 shared + 3 backend); sıradaki TASK-1.07.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 6/34 task — TASK-1.06 tamamlandı; sıradaki adım `/devflow:run-task` ile TASK-1.07 (i18n shell)
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

**Task:** TASK-1.07 — i18n shell (i18next mobile + backend, TR-only)
**Durum:** ⬜ Bekliyor
**İlerleme:** Bir sonraki oturumda `/devflow:run-task` ile çalıştırılacak.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 6 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03 | Prisma 7 + adapter-pg + ilk migration + generate smoke | ✅ Tamamlandı |
| 1.04 | Backend test altyapısı (Vitest + per-suite Postgres) | ✅ Tamamlandı |
| 1.05 | Mobile Expo SDK 56 + Expo Router iskelet | ✅ Tamamlandı |
| 1.06 | TR locale util + lint kuralı (toLowerCase yasağı) | ✅ Tamamlandı |
| 1.07–1.16 | M0 Altyapı (i18n, mobile test, CI, hosting, Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (10) |
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

### TASK-1.06 — TR locale util + lint kuralı (toLowerCase yasağı) (2026-05-29) ✅

- `@alpfit/shared` paketine `locale.ts` (`trLower/trUpper` → `toLocaleLowerCase/Upper('tr-TR')` wrapper'ı), `phone.ts` (`libphonenumber-js/mobile` build ile `parseTrPhone/formatTrPhone/validateTrPhone`; TR mobil 5XX kabul, sabit hat 212/312 ve yabancı +1/+44 ret), `date.ts` (`date-fns-tz/formatInTimeZone` + `date-fns/locale/tr` ile `formatTrDate/Short/Time/DateTime` — system TZ'dan bağımsız `Europe/Istanbul`; Türkiye 2016'dan beri DST kullanmıyor, Mart/Ekim sınırı sabit UTC+3 test edildi). 41 unit test (locale 16 + phone 16 + date 9).
- **ESLint kuralı** `eslint.config.mjs` — `no-restricted-syntax` selector `CallExpression[callee.property.name='toLowerCase']:not([arguments.length>=1])` + `toUpperCase`; ham `.toLowerCase()/.toUpperCase()` yasak, argümanlı `.toLocaleLowerCase('tr-TR')` (locale.ts kendi içinde) istisna. Smoke: `shared/src/__smoke.ts` geçici dosyaya raw çağrı yazıldı → `pnpm exec eslint` 2 error TR mesajıyla; dosya silindi. Memory `[[tr-locale-util-zorunlu]]` Süreç Disiplinleri kategorisinde.
- **Mobile Metro shim** (`mobile/metro.config.js`) — `.js → .ts/.tsx` resolveRequest fallback (NodeNext stilindeki `import './x.js'` çağrılarını TS kaynağına yönlendirir) + `nodeModulesPaths += workspaceRoot/shared/node_modules` (pnpm izole layout'da shared transitive deps mobile flat-hoist'una düşmüyordu); kullanıcı `AskUserQuestion` ile resolveRequest patch'i (dist-based alternatife karşı) onayladı. Backend `pretypecheck` zinciri `pnpm db:generate && pnpm -F @alpfit/shared build` (composite + project ref TS auto-build yapmıyor).
- Test kriterleri ✅ — `pnpm test` 44 passed (41 shared 0.66s + 3 backend 1.45s), `pnpm lint` temiz (ham toLowerCase yasağı aktif + locale.ts argümanlı çağrı geçer), `pnpm typecheck` 3 paket temiz, `pnpm format:check` temiz, `pnpm -F @alpfit/mobile run export:smoke` 1185 modül 1.6MB web bundle başarılı (Metro shim + shared/node_modules path doğrulandı); DECISIONS.md yeni karar girdisi (TR Locale Util Paketi + ESLint + Metro/pnpm Resolution)

### TASK-1.05 — Mobile Expo SDK 56 + Expo Router iskelet (2026-05-29) ✅

- Expo SDK 56 (`~56.0.7`) + React Native **0.85.3** + React 19.2.6 + Expo Router (`~56.2.8`) + file-based routing kuruldu. **RN versiyon revizyonu:** task doc'un "RN 0.81" satırı Expo SDK 56 bundled native modules JSON ile çatışıyordu (`AskUserQuestion` ile bundled pairing onaylandı, DECISIONS girdisi). `pnpm create expo-app` yerine manuel scaffold (pnpm lock korundu); peer warnings için `react-server-dom-webpack` exact `19.2.4` + `@types/react ~19.2.0`.
- **Dosyalar (yeni):** `mobile/app.json` (scheme `alpfit`, bundleId `app.alpfit.mobile`, `newArchEnabled: true`, plugins `[expo-router]`, `experiments.typedRoutes: true`, `web.bundler: metro`); `mobile/app.config.ts` (`EXPO_PUBLIC_*` env-aware bracket access — strict tsconfig uyumlu); `mobile/babel.config.js` (`babel-preset-expo`); `mobile/metro.config.js` (`watchFolders: [workspaceRoot]` + `nodeModulesPaths` + `disableHierarchicalLookup`); `mobile/app/_layout.tsx` (Stack + StatusBar); `mobile/app/index.tsx` (landing "Merhaba Alpfit" placeholder); `mobile/.env.example`; `mobile/.npmrc` (`node-linker=hoisted` — pnpm 8+ per-workspace, Metro flat resolution); `mobile/expo-env.d.ts`; `mobile/README.md`. **Güncelle:** `mobile/tsconfig.json` (extends base + mobile-only `jsx/module/moduleResolution/lib/target` override); `eslint.config.mjs` (Expo CommonJS config'leri için ayrı section + `.expo-export-smoke/` ignore); root `package.json` (`dev` script + `globals` devDep); `.gitignore`+`.prettierignore`.
- Test kriterleri ✅ — `expo --version` 56.1.13, `expo config --type public` SDK 56.0.0 + scheme `alpfit` resolve; `expo export -p web` 4.2s 767 modül 1.1MB bundle (transitive `expo-modules-core` flat hoisted layout'tan çözüldü); typecheck/lint/format temiz; backend regresyonsuz (3 test passed 1.36s); DECISIONS.md yeni karar girdisi (RN versiyon revizyonu + hoisted linker rationale + smoke stratejisi)

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

<!-- Bu bölüm sadece /devflow:pause kullanıldığında doldurulur. Devam edildiğinde silinir. -->

> ⏸️ **Duraklatma yok** — Aktif çalışma devam ediyor.

## Hızlı Erişim

**Aktif Task:** TASK-1.07 — i18n shell (i18next mobile + backend, TR-only)
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** 2026-05-29 — TASK-1.06 ✅: `@alpfit/shared` TR locale util (trLower/trUpper + parseTrPhone/formatTrPhone/validateTrPhone + formatTrDate{,Short,Time,Time}); ESLint `no-restricted-syntax` ham `.toLowerCase()/.toUpperCase()` yasağı; mobile Metro `.js→.ts` shim + `shared/node_modules` path; backend pretypecheck shared rebuild; 44 test passed (41 shared + 3 backend); sıradaki TASK-1.07.
