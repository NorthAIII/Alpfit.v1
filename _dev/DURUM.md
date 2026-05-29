# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.12 ✅: mobile Sentry RN 8.13 + crypto-js 4.2 kuruldu; backend kontratıyla birebir paralel 3 katmanlı KVKK savunma — Sentry `sendDefaultPii: false` + `beforeSend` recursive scrubber (request/user/extra/contexts/breadcrumbs) + `beforeBreadcrumb` URL sanitize + HTTP body drop; `sanitizeUrl()` `SENSITIVE_PATH_PATTERNS` (8 prefix) + defansif UUID/numeric/16+ char alphanum lookahead-anchored regex (`(?=[/?#]|$)` aksi halde `\d+` UUID'nin hex chunk'ını yiyor); `hashUserId()` `crypto-js/sha256` sync 12-hex — Node parity testi `73475cb40a56` backend ile aynı; `initSentry()` DSN yoksa no-op + production/staging `console.warn` degrade mode; `initSentryFromEnv()` `EXPO_PUBLIC_*` okur; `app.config.ts` `@sentry/react-native/expo` plugin (Yakın 5 EAS Build source map upload için yapı kurulu, auth token yok → no-op); `app/_layout.tsx` module-level init + `Sentry.wrap(RootLayout)` error boundary; PII_FIELDS SSOT `@alpfit/shared` paylaşımı (drift yok); 23 test PASS (scrubber × 3 + scrubPii × 2 + hashUserId × 4 + sanitizeUrl × 4 + beforeBreadcrumb × 3 + initSentry × 4 + negatif kanıt) + backend 20 PASS regression yok; sıradaki TASK-1.13 3 rol veri modeli (Member + Trainer + Gym Owner enum).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 12/34 task tamam; sıradaki TASK-1.13 3 rol veri modeli (Member + Trainer + Gym Owner Prisma enum)
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

**Task:** Yok — TASK-1.12 ✅ tamamlandı, sıradaki TASK-1.13 (3 rol veri modeli — Member + Trainer + Gym Owner enum) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.13` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 12 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.12 | Mobile Sentry crash reporting + PII scrubber | ✅ Tamamlandı |
| 1.13–1.16 | M0 Altyapı (3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (4) |
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

### TASK-1.11 — Backend Sentry + PII scrubber + KVKK test (2026-05-29) ✅

- **3 katmanlı KVKK PII savunması:** (a) `@sentry/node@10.55.0` init `sendDefaultPii: false` + `tracesSampleRate` prod 0.1 / dev-staging 1.0 + `environment: APP_ENV`; (b) `sentryBeforeSend<E extends Event>(e: E): E` recursive scrubber — `event.request.{data, cookies, query_string, headers}` + `event.user` (id sha256-12 hash, email/username/ip_address sil) + `event.extra` + `event.contexts` + `event.breadcrumbs[].data`; (c) pino `redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' }` her PII alanı için 4 seviye wildcard (`field`, `*.field`, `*.*.field`, `*.*.*.field`). Sentry'nin `Event` (genel) vs `ErrorEvent` (`type: undefined`) tipi gerilimi generic ile çözüldü.
- **PII_FIELDS SSOT (`shared/src/pii-fields.ts`):** readonly tuple; kimlik (phone/phoneNumber/phone_number/mobile/tel/email/name/firstName/.../displayName) + Madde 6 sağlık verisi (weight/height/measurement(s)/bodyFat/bmi/waist/hip/chest/arm/thigh) + yemek (foodLog/meal(s)/mealLog/food/calories/kcal/macros/protein/carbs/fat) + not(s)/comment(s) + rıza (kvkkConsent/healthDataConsent/consent) + auth/sır (password/otp/otpCode/smsCode/verificationCode/token/accessToken/refreshToken/secret/apiKey/authorization). camelCase + snake_case birlikte. `getPinoRedactPaths()` 4 seviye wildcard üretir. Backend + (TASK-1.12) mobile paylaşır. `shared/src/index.ts` re-export.
- **Degrade mode + entrypoint:** `initSentry({env, dsn?, release?})` `SENTRY_DSN` env yoksa false döner + (staging/prod'da) stderr warning; app çalışmaya devam eder. `backend/src/index.ts` `start()` akışına `buildServer()` öncesi `initSentry({env})` çağrısı eklendi — Sentry sonraki kod path'i içindeki hataları yakalasın.
- **Test (`pii-scrubber.test.ts`):** 11 PASS — Sentry beforeSend × 3 (PII alanlı kompleks event scrub, missing fields graceful, breadcrumb data); scrubPii × 3 (immutable, array, cyclic ref); hashUserId × 3 (12 hex format, deterministic, farklı input farklı çıktı); pino redact × 1 (JSON stdout capture — `phone/weight/mealLog/password/email` `[REDACTED]`, `traceId/msg` korundu, raw değerler yok); negatif kanıt × 1 (`event.user.id` hash format, ham `phone` `[REDACTED]`, serialized event'te `+90555...` ve raw user-id yok). Sentry SDK gerçekten init edilmez (network/global state riski) — scrubber doğrudan çağrılır.
- **Doküman + disiplin:** `_dev/docs/sentry-setup.md` — Sentry Cloud EU proje açma (`.de.sentry.io` DSN doğrulaması) + DSN env wiring (`/opt/alpfit/_ops/staging/.env.staging`) + quota webhook 80%/100% Settings → Usage & Billing → Notifications + Spike Protection per-project + KVKK Security & Privacy checklist (Data Scrubbing + Additional Sensitive Fields redundant + EU Frankfurt residency + 30 gün retention) + release tracking opsiyonel + manuel staging smoke senaryosu + haftalık quota check. `_dev/memory/kvkk-pii-scrubbing-matrisi.md` Süreç Disiplini: SSOT yeri, 3 katman matrisi, 4 kontrol anı (DB schema task, yeni endpoint task, PR review, faz review), wildcard 4 seviye sınırı uyarısı, test bağı. MEMORY.md "Süreç Disiplinleri" altına pointer. DECISIONS.md "3 Katmanlı KVKK PII Scrubbing Matrisi" kararı (4 seçenek + tradeoff'lar).
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` 20 PASS (11 pii-scrubber + 9 healthz). `pnpm -F @alpfit/backend typecheck` temiz. `pnpm lint`/`format:check`/`typecheck` (recursive) temiz. Manuel staging Sentry dashboard smoke (`docs/sentry-setup.md §6`) gerçek Sentry projesi açıldıktan sonra yapılır — kapsam dışı, kod + rehber teslim edildi.

### TASK-1.12 — Mobile Sentry crash reporting + PII scrubber (2026-05-29) ✅

- **Paket + plugin kurulumu:** `pnpm -F @alpfit/mobile add @sentry/react-native@^8.13.0 crypto-js@^4.2.0` + dev `@types/crypto-js@^4.2.2`. Sentry RN peer deps `expo: >=49.0.0` / RN `>=0.65.0` — Expo SDK 56 + RN 0.85 uyumlu. `mobile/app.config.ts` `plugins` array'ine `@sentry/react-native/expo` eklendi (Yakın 5'te EAS Build source map upload için yapı kurulu; auth token yokken plugin no-op — dev/runtime side-effect yok). Karar: `sentry-expo` deprecated → `@sentry/react-native` doğrudan kullanıldı (task plan'ı bunu öneriyordu).
- **`pii-scrubber.ts` (YENİ, backend kontratıyla birebir paralel):** `scrubPii<T>(value)` recursive + immutable + WeakSet cyclic-safe + `PII_FIELD_SET = new Set(PII_FIELDS)` shared SSOT. `hashUserId(rawId)` — Node `crypto` yok; `crypto-js/sha256` + `crypto-js/enc-hex` sync sha256 → 12 hex char. **Cross-platform parity:** `hashUserId(42) === '73475cb40a56'` backend Node `createHash('sha256')` ile aynı sonuç (test'le sabitlendi). `sentryBeforeSend<E>(event)` — `request.{data, cookies, query_string, headers}` + `user` (id hash, email/username/ip_address sil) + `extra` + `contexts` + `breadcrumbs[].data` scrub. `sentryBeforeBreadcrumb(breadcrumb, hint?)` — URL/from/to `sanitizeUrl`'den geçer + fetch/xhr/http kategorilerinde `request_body/response_body/body` drop + tüm `data` `scrubPii` recursive. Tip workaround: `BreadcrumbHint` `@sentry/react-native` re-export ETMİYOR (`@sentry/core` transitive dep eklemek riski yerine yapısal `type BreadcrumbHint = Record<string, unknown>`).
- **`sanitizeUrl()` (YENİ) + ID_SEGMENT_REGEX bug fix:** `SENSITIVE_PATH_PATTERNS` 8 prefix (`/me/measurements`, `/me/food-log`, `/me/notes`, `/pt/members`, `/members`, `/measurements`, `/food-log`, `/invites`). Ek defansif regex `\/(\d+|UUID|[a-z0-9]{16,})(?=[/?#]|$)/gi` — lookahead `(?=[/?#]|$)` kritik: ilk versiyonda lookahead yoktu, `\d+` UUID'nin ilk hex chunk'ını yiyordu (`/api/x/550e8400-...-y` → `/api/x/[id]e8400-...-y` bug test'le bulundu). Lookahead her alternatifin tam segment'i kapsamasını zorlar — fix: UUID regex tamamı match olur, `\d+` lookahead fail'i nedeniyle backtrack eder.
- **`sentry.ts` (YENİ) + `initSentryFromEnv()`:** `initSentry({dsn?, environment, release?})` — DSN boşsa `false` döner; staging/production'da `console.warn` (throw yok, degrade mode). `Sentry.init({dsn, environment, release, sendDefaultPii: false, tracesSampleRate: production? 0.1 : 1.0, beforeSend, beforeBreadcrumb, enableAutoSessionTracking: true})`. `initSentryFromEnv()` `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_APP_ENV` (fallback `NODE_ENV` → `development`), `EXPO_PUBLIC_SENTRY_RELEASE` okur. `SentryEnvironment` union + `isSentryEnvironment` type guard. `Sentry` namespace re-export (layout'tan `Sentry.wrap` için).
- **`app/_layout.tsx` (UPDATE) + `.env.example` (UPDATE):** Module-level `initSentryFromEnv()` (React render'dan ÖNCE; boot-time hatalar yakalanır). `export default Sentry.wrap(RootLayout)` — init edilmemişse no-op error boundary. `.env.example` `EXPO_PUBLIC_SENTRY_DSN=` placeholder + EU Frankfurt residency açıklaması + `EXPO_PUBLIC_APP_ENV=development` (initSentryFromEnv için fallback yeterli ama belirginlik için yazıldı). `EXPO_PUBLIC_*` bundle'a girer → DSN public (Sentry kabul).
- **`sentry.test.ts` 23 PASS:** `jest.mock('@sentry/react-native')` (network/global state riski olmadan). `sentryBeforeSend` × 3 (kompleks event scrub, missing fields, breadcrumb data) + `scrubPii` × 2 (immutable, cyclic) + `hashUserId` × 4 (12-hex format, deterministic, distinct inputs, **Node sha256 cross-platform parity** sabit `73475cb40a56`) + `sanitizeUrl` × 4 (sensitive prefix, UUID anywhere — bug fix kanıtı, numeric anywhere, untouched paths) + `sentryBeforeBreadcrumb` × 3 (fetch URL+body drop, navigation to/from, ui.click PII scrub) + `initSentry` × 4 (degrade no-DSN, production warn, init args PII-safe, traces rate 0.1 prod) + negatif kanıt × 1 (serialized event'te ham telefon/üye ID YOK).
- Test kriterleri ✅ — `pnpm -F @alpfit/mobile test` 23 PASS (Sentry SDK mock + scrubber + transformer + init + negatif kanıt). `pnpm -F @alpfit/mobile typecheck` temiz. `pnpm typecheck` (recursive: shared + mobile + backend) temiz. `pnpm lint` + `pnpm format:check` temiz (prettier auto-fix 2 dosya). `pnpm -F @alpfit/backend test` 20 PASS regression yok (PII_FIELDS SSOT paylaşımı backend kırmadı). `pnpm -F @alpfit/shared test` 41 PASS. Manuel staging Sentry dashboard smoke (test event Sentry'de PII'siz görünür) gerçek Sentry projesi açıldıktan sonra Yakın 1 son task'inde uçtan uca smoke ile — bu task kapsamı dışı, kod + rehber teslim edildi.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.12 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.13` (3 rol veri modeli — Member + Trainer + Gym Owner Prisma enum + ilişki tabloları)

---

**Son Güncelleme:** 2026-05-29 — TASK-1.12 ✅: mobile Sentry RN 8.13 + crypto-js 4.2 kuruldu; backend kontratıyla birebir paralel 3 katmanlı KVKK savunma — Sentry `sendDefaultPii: false` + `beforeSend` recursive scrubber + `beforeBreadcrumb` URL sanitize + HTTP body drop; `sanitizeUrl()` 8 sensitive prefix + lookahead-anchored UUID/numeric defansif regex; `hashUserId()` crypto-js sha256 sync 12-hex Node parity sabit `73475cb40a56`; `initSentry()` degrade mode + `initSentryFromEnv()` `EXPO_PUBLIC_*`; `app.config.ts` `@sentry/react-native/expo` plugin (Yakın 5 source map upload için yapı kurulu); `_layout.tsx` module-level init + `Sentry.wrap`; PII_FIELDS SSOT `@alpfit/shared` paylaşımı (drift yok); 23 test PASS + backend 20 PASS regression yok; sıradaki TASK-1.13 3 rol veri modeli.
