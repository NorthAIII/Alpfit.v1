# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.13 ✅: 3 rol veri modeli Prisma 7 schema'ya yerleşti — `Role` enum (`member`/`trainer`/`gym_owner`, diyetisyen ASLA YOK) + `User` (cuid id, globally unique `phoneE164`, opsiyonel PT alanları `gymName`/`certificateNote`, KVKK `kvkkConsentAt`/`healthConsentAt`, soft-delete `deletedAt`/`retentionDeadline`) + `TrainerMember` + `GymOwnerTrainer` (v1 boş slot, model + index hazır); migration `20260529190917_three_role_data_model` Prisma DDL + **raw partial unique index'ler** — `WHERE "endedAt" IS NULL` (TrainerMember.memberId + GymOwnerTrainer.trainerId) Prisma DSL NULL semantiği aktif çoklu satırı engelleyemediği için zorunlu, `migrate deploy` her ortamda otomatik; `relations.ts` `assertSingleActivePtForMember` placeholder + `ActiveTrainerRelationExistsError` (TASK-1.24 davet kabul için); `shared/src/pii-fields.ts` `gymName`/`certificateNote`/`phoneE164` (camelCase + snake_case) eklendi; 6 integration test PASS (phoneE164 global unique + gym_owner DB-izinli + TrainerMember partial unique + sonlanma sonrası yeni PT + helper null/throw + GymOwnerTrainer partial unique); backend 26 / shared 41 / mobile 23 PASS regression yok; typecheck + lint + format temiz; psql ile partial index manuel doğrulandı; karar noktaları "best practice" altında çözüldü: phone global unique (F1.1 mesajıyla hizalı) + cuid (k-sorted); sıradaki TASK-1.14 KVKK consent audit log.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 13/34 task tamam; sıradaki TASK-1.14 KVKK consent schema + audit log
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

**Task:** Yok — TASK-1.13 ✅ tamamlandı, sıradaki TASK-1.14 (KVKK consent schema + audit log) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.14` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 13 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.13 | 3 rol veri modeli (User + role enum + ilişki tabloları) | ✅ Tamamlandı |
| 1.14–1.16 | M0 Altyapı (KVKK consent, retention, yedek) | ⬜ Bekliyor (3) |
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

### TASK-1.12 — Mobile Sentry crash reporting + PII scrubber (2026-05-29) ✅

- **Paket + plugin kurulumu:** `pnpm -F @alpfit/mobile add @sentry/react-native@^8.13.0 crypto-js@^4.2.0` + dev `@types/crypto-js@^4.2.2`. Sentry RN peer deps `expo: >=49.0.0` / RN `>=0.65.0` — Expo SDK 56 + RN 0.85 uyumlu. `mobile/app.config.ts` `plugins` array'ine `@sentry/react-native/expo` eklendi (Yakın 5'te EAS Build source map upload için yapı kurulu; auth token yokken plugin no-op — dev/runtime side-effect yok). Karar: `sentry-expo` deprecated → `@sentry/react-native` doğrudan kullanıldı (task plan'ı bunu öneriyordu).
- **`pii-scrubber.ts` (YENİ, backend kontratıyla birebir paralel):** `scrubPii<T>(value)` recursive + immutable + WeakSet cyclic-safe + `PII_FIELD_SET = new Set(PII_FIELDS)` shared SSOT. `hashUserId(rawId)` — Node `crypto` yok; `crypto-js/sha256` + `crypto-js/enc-hex` sync sha256 → 12 hex char. **Cross-platform parity:** `hashUserId(42) === '73475cb40a56'` backend Node `createHash('sha256')` ile aynı sonuç (test'le sabitlendi). `sentryBeforeSend<E>(event)` — `request.{data, cookies, query_string, headers}` + `user` (id hash, email/username/ip_address sil) + `extra` + `contexts` + `breadcrumbs[].data` scrub. `sentryBeforeBreadcrumb(breadcrumb, hint?)` — URL/from/to `sanitizeUrl`'den geçer + fetch/xhr/http kategorilerinde `request_body/response_body/body` drop + tüm `data` `scrubPii` recursive. Tip workaround: `BreadcrumbHint` `@sentry/react-native` re-export ETMİYOR (`@sentry/core` transitive dep eklemek riski yerine yapısal `type BreadcrumbHint = Record<string, unknown>`).
- **`sanitizeUrl()` (YENİ) + ID_SEGMENT_REGEX bug fix:** `SENSITIVE_PATH_PATTERNS` 8 prefix (`/me/measurements`, `/me/food-log`, `/me/notes`, `/pt/members`, `/members`, `/measurements`, `/food-log`, `/invites`). Ek defansif regex `\/(\d+|UUID|[a-z0-9]{16,})(?=[/?#]|$)/gi` — lookahead `(?=[/?#]|$)` kritik: ilk versiyonda lookahead yoktu, `\d+` UUID'nin ilk hex chunk'ını yiyordu (`/api/x/550e8400-...-y` → `/api/x/[id]e8400-...-y` bug test'le bulundu). Lookahead her alternatifin tam segment'i kapsamasını zorlar — fix: UUID regex tamamı match olur, `\d+` lookahead fail'i nedeniyle backtrack eder.
- **`sentry.ts` (YENİ) + `initSentryFromEnv()`:** `initSentry({dsn?, environment, release?})` — DSN boşsa `false` döner; staging/production'da `console.warn` (throw yok, degrade mode). `Sentry.init({dsn, environment, release, sendDefaultPii: false, tracesSampleRate: production? 0.1 : 1.0, beforeSend, beforeBreadcrumb, enableAutoSessionTracking: true})`. `initSentryFromEnv()` `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_APP_ENV` (fallback `NODE_ENV` → `development`), `EXPO_PUBLIC_SENTRY_RELEASE` okur. `SentryEnvironment` union + `isSentryEnvironment` type guard. `Sentry` namespace re-export (layout'tan `Sentry.wrap` için).
- **`app/_layout.tsx` (UPDATE) + `.env.example` (UPDATE):** Module-level `initSentryFromEnv()` (React render'dan ÖNCE; boot-time hatalar yakalanır). `export default Sentry.wrap(RootLayout)` — init edilmemişse no-op error boundary. `.env.example` `EXPO_PUBLIC_SENTRY_DSN=` placeholder + EU Frankfurt residency açıklaması + `EXPO_PUBLIC_APP_ENV=development` (initSentryFromEnv için fallback yeterli ama belirginlik için yazıldı). `EXPO_PUBLIC_*` bundle'a girer → DSN public (Sentry kabul).
- **`sentry.test.ts` 23 PASS:** `jest.mock('@sentry/react-native')` (network/global state riski olmadan). `sentryBeforeSend` × 3 (kompleks event scrub, missing fields, breadcrumb data) + `scrubPii` × 2 (immutable, cyclic) + `hashUserId` × 4 (12-hex format, deterministic, distinct inputs, **Node sha256 cross-platform parity** sabit `73475cb40a56`) + `sanitizeUrl` × 4 (sensitive prefix, UUID anywhere — bug fix kanıtı, numeric anywhere, untouched paths) + `sentryBeforeBreadcrumb` × 3 (fetch URL+body drop, navigation to/from, ui.click PII scrub) + `initSentry` × 4 (degrade no-DSN, production warn, init args PII-safe, traces rate 0.1 prod) + negatif kanıt × 1 (serialized event'te ham telefon/üye ID YOK).
- Test kriterleri ✅ — `pnpm -F @alpfit/mobile test` 23 PASS (Sentry SDK mock + scrubber + transformer + init + negatif kanıt). `pnpm -F @alpfit/mobile typecheck` temiz. `pnpm typecheck` (recursive: shared + mobile + backend) temiz. `pnpm lint` + `pnpm format:check` temiz (prettier auto-fix 2 dosya). `pnpm -F @alpfit/backend test` 20 PASS regression yok (PII_FIELDS SSOT paylaşımı backend kırmadı). `pnpm -F @alpfit/shared test` 41 PASS. Manuel staging Sentry dashboard smoke (test event Sentry'de PII'siz görünür) gerçek Sentry projesi açıldıktan sonra Yakın 1 son task'inde uçtan uca smoke ile — bu task kapsamı dışı, kod + rehber teslim edildi.

### TASK-1.13 — 3 rol veri modeli (User + role enum + ilişki tabloları) (2026-05-29) ✅

- **Prisma 7 schema (`backend/prisma/schema.prisma`)** — `Role` enum (`member`/`trainer`/`gym_owner`, diyetisyen ASLA YOK — VISION §5) + `User` (cuid id, globally unique `phoneE164`, `role`, `firstName`/`lastName`, opsiyonel `profilePhotoUrl`/`gymName`/`certificateNote`, KVKK `kvkkConsentAt`/`healthConsentAt`, soft-delete `deletedAt`/`retentionDeadline`, audit `createdAt`/`updatedAt`, index `role`) + `TrainerMember` (cuid, trainerId+memberId, startedAt+`endedAt nullable`, index `trainerId`/`memberId`/`(memberId, endedAt)`) + `GymOwnerTrainer` (v1 boş slot, trainer-bazlı aynı yapı). ILKELER §Pazarlık Konusu Olmayanlar §1: 3 rol şimdiden taşır, v1.5+'da migration yükü yok.
- **Migration `20260529190917_three_role_data_model/migration.sql`** — `prisma migrate dev --create-only` ile Prisma'nın ürettiği DDL (enum + 3 tablo + index + FK) + **raw partial unique index'ler:** `CREATE UNIQUE INDEX "TrainerMember_memberId_active_unique" ON "TrainerMember" ("memberId") WHERE "endedAt" IS NULL` + GymOwnerTrainer için trainer-bazlı eşi. **Kritik karar (DECISIONS.md detayı):** Prisma DSL `@@unique([..., endedAt])` PostgreSQL NULL semantiği (NULL ≠ NULL) yüzünden iki aktif satırı engelleyemediği için raw SQL şart; partial index race-safe + atomic. `migrate deploy` her ortamda otomatik uygular (test/db.ts `prisma migrate deploy` ile per-suite isolated DB de partial index'i alır → testler partial index'in deploy garantisini de doğrular).
- **`backend/src/auth/relations.ts` (YENİ) + `shared/src/pii-fields.ts` (UPDATE)** — `assertSingleActivePtForMember(prisma, memberId)` placeholder helper + named `ActiveTrainerRelationExistsError` (TASK-1.24 davet kabul akışında kullanılacak; DB partial index son güvence, helper UX-friendly mesaj). PII_FIELDS SSOT'a `gymName`/`gym_name`, `certificateNote`/`certificate_note`, `phoneE164`/`phone_e164` eklendi (camelCase + snake_case, `kvkk-pii-scrubbing-matrisi.md` disiplini); `firstName`/`lastName` zaten vardı.
- **`relations.test.ts` 6 PASS** — vitest + per-suite isolated Postgres: (1) phoneE164 global unique — aynı telefon iki rolde 2. create rejekte (PRD F1.1 mesajı için "global unique vs composite" karar noktası: F1.1 ile birebir hizalı global seçildi); (2) `gym_owner` DB-izinli — UI engellemesi sonraki katmanda; (3) TrainerMember partial unique — iki aktif PT rejekte; (4) Sonlandırılan ilişki sonrası yeni PT atanabiliyor + aktif sayım = 1; (5) `assertSingleActivePtForMember` null→resolves, aktif→rejects.toBeInstanceOf; (6) GymOwnerTrainer partial unique. Manuel `psql \d` çıktısında partial index'ler `WHERE "endedAt" IS NULL` ile görünüyor.
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` **26 PASS** (önceki 20 + yeni 6). `pnpm typecheck` (recursive) temiz. `pnpm lint` + `pnpm format:check` temiz (1 import/order + 1 prettier auto-fix). `pnpm -F @alpfit/shared test` 41 PASS + `pnpm -F @alpfit/mobile test` 23 PASS regression yok. DECISIONS.md "3 Rol Veri Modeli + Telefon Tekliği + Aktif İlişki Partial Unique Index" kararı (phone uniqueness 2 seçenek + DB enforcement 4 seçenek + cuid + Gym Owner slot + soft-delete deseni + risk/mitigation). Karar noktaları "best practice" altında kullanıcıya sormadan çözüldü (oturum başında verilen yetki).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.13 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.14` (KVKK consent schema + audit log)

---

**Son Güncelleme:** 2026-05-29 — TASK-1.13 ✅: 3 rol veri modeli Prisma 7 schema'ya yerleşti — `Role` enum (`member`/`trainer`/`gym_owner`) + `User` (cuid id, globally unique `phoneE164`, opsiyonel `gymName`/`certificateNote`, KVKK `kvkkConsentAt`/`healthConsentAt`, soft-delete `deletedAt`/`retentionDeadline`) + `TrainerMember` + `GymOwnerTrainer` (v1 boş slot); migration `20260529190917_three_role_data_model` Prisma DDL + **raw partial unique index'ler** (`WHERE "endedAt" IS NULL`) — Prisma DSL NULL semantiği aktif çoklu satırı engelleyemediğinden zorunlu; `relations.ts` `assertSingleActivePtForMember` placeholder + `ActiveTrainerRelationExistsError`; PII_FIELDS SSOT'a `gymName`/`certificateNote`/`phoneE164` eklendi; 6 integration test PASS (global unique + gym_owner izinli + iki partial index + helper + sonlanma sonrası yeni PT); backend 26 / shared 41 / mobile 23 PASS regression yok; typecheck + lint + format temiz; karar noktaları best practice altında çözüldü (phone global unique + cuid); sıradaki TASK-1.14 KVKK consent audit log.
