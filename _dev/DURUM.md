# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.14 ✅: KVKK consent + audit log şeması yerleşti — `ConsentType` (kvkk_aydinlatma / saglik_verisi / pazarlama_iletisim) + `ConsentEventType` (granted / revoked / auto_revoked) + `AuditEventType` (16 v1 event) enum; `ConsentRecord` (versiyonlu append-only, `textVersion` + `ipAddress`/`userAgent` opsiyonel KVKK denetim için bilinçli) + `AuditLog` (`userIdHash` sha256 prefix 12 hex, metadata Json? zod whitelist enforce, ham userId DB'de YOK); migration `20260529205040_kvkk_consent_audit` Prisma DDL (2 enum + 2 tablo + 6 index + 1 FK); `backend/src/kvkk/consent.ts` `recordConsent` Prisma `$transaction` ile event insert + User cache (kvkkConsentAt/healthConsentAt) senkron + `getActiveConsent` truth-source query; `backend/src/kvkk/audit.ts` `AuditMetadataSchema` zod `.strict()` 10 izinli alan (`ip`/`deviceType`/`userAgent`/`invitationId`/`refreshTokenId`/`consentType`/`textVersion`/`attemptCount`/`count`/`reason`) — bilinmeyen anahtar ZodError + `logAuditEvent` `hashUserId` (pii-scrubber re-use, Sentry event correlation ile aynı algoritma); `shared/src/pii-fields.ts` `ip`/`ipAddress`/`userAgent` (camelCase+snake_case) eklendi; 12 integration test PASS (audit: phone/weight/firstName+email zod reddi + DB'ye yazılmadığı kanıt + ip+deviceType+consent metadata kabul + hash 12-hex + correlation; consent: granted→active + revoked→inactive append-only + denormalized cache + pazarlama cache YOK + truth-source); backend 38 / shared 41 / mobile 23 PASS regresyon yok; typecheck + lint + format temiz; sıradaki TASK-1.15 soft delete + 30 gün retention job.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 14/34 task tamam; sıradaki TASK-1.15 soft delete + 30 gün retention job
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

**Task:** Yok — TASK-1.14 ✅ tamamlandı, sıradaki TASK-1.15 (Soft delete + 30 gün retention job) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.15` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 14 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.14 | KVKK consent schema + audit log | ✅ Tamamlandı |
| 1.15–1.16 | M0 Altyapı (retention, yedek) | ⬜ Bekliyor (2) |
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

### TASK-1.14 — KVKK consent schema + audit log (2026-05-29) ✅

- **Prisma schema** — 3 yeni enum (`ConsentType` kvkk_aydinlatma/saglik_verisi/pazarlama_iletisim; `ConsentEventType` granted/revoked/auto_revoked; `AuditEventType` 16 v1 event) + 2 yeni tablo: `ConsentRecord` (cuid, userId FK, consentType, eventType, `textVersion` tarih-bazlı string, `occurredAt` default now, opsiyonel `ipAddress`/`userAgent` KVKK denetim için bilinçli toplanır; index `userId+consentType`/`occurredAt`) + `AuditLog` (cuid, **`userIdHash` ham userId değil** sha256 prefix 12 hex, eventType, occurredAt, `metadata Json?`; index userIdHash/occurredAt/eventType). `User.consentRecords ConsentRecord[]` relation eklendi; mevcut `kvkkConsentAt`/`healthConsentAt` denormalized cache olarak kalır, truth source ConsentRecord query.
- **Migration `20260529205040_kvkk_consent_audit`** — Prisma `migrate dev --create-only` ile saf DDL (2 enum + 2 tablo + 6 index + 1 FK ConsentRecord→User). Raw SQL yok (TASK-1.13'tekinden farklı: partial unique index gereksinimi yok burada). `migrate deploy` ile DB'ye uygulandı; test/db.ts her suite için aynı komutu çalıştırdığından integration test'ler deploy garantisini doğrular.
- **`backend/src/kvkk/consent.ts` (YENİ)** — `recordConsent(prisma, args)` Prisma `$transaction` ile (a) ConsentRecord insert + (b) User denormalized cache update: `kvkk_aydinlatma` → `User.kvkkConsentAt`, `saglik_verisi` → `User.healthConsentAt`, `pazarlama_iletisim` → cache YOK (v1 alan yok); `granted` → `occurredAt`, `revoked`/`auto_revoked` → null. `getActiveConsent(prisma, userId, type)` en son event'i `orderBy occurredAt desc limit 1` ile çeker, `granted` mı kontrolü (truth source).
- **`backend/src/kvkk/audit.ts` (YENİ)** — `AuditMetadataSchema` zod **`.strict()` whitelist** 10 alan (`ip`/`deviceType`/`userAgent`/`invitationId`/`refreshTokenId`/`consentType`/`textVersion`/`attemptCount`/`count`/`reason`) — bilinmeyen anahtar ZodError fırlatır. `logAuditEvent(prisma, args)` — metadata varsa parse, `hashUserId(args.userId)` (pii-scrubber.ts'ten re-use: sha256 prefix 12 hex; **Sentry event correlation ile aynı algoritma** → audit ↔ Sentry hash hizalı), append-only insert. `null` literal'i Prisma 7 strict `Json?` tipinde reddedildiği için `validated === undefined` durumda field-omit (DB default NULL) — `Prisma.DbNull` yerine daha sade.
- **`shared/src/pii-fields.ts` (UPDATE)** — `ip`/`ipAddress`/`ip_address`/`userAgent`/`user_agent` eklendi (camelCase+snake_case SSOT). Inline yorum **IP audit nüansı**: ConsentRecord/AuditLog DB'sine bilinçli yazılır + AuditLog metadata zod whitelist'inde `ip`/`userAgent` izinli; ama log/Sentry yoluna sızarsa **pino redact + Sentry beforeSend** scrubber bunu yakalar. `kvkk-pii-scrubbing-matrisi.md` memory güncellendi.
- **`backend/src/kvkk/audit.test.ts` 8 PASS** — zod whitelist red 3 senaryo (`phone` + `weight` + `firstName`/`email` parseAsync) + `count() === 0` ile DB'ye row YAZILMADI kanıtı; whitelist içi kabul 3 senaryo (ip+deviceType, metadata-yok=null, consent event consentType+textVersion); userIdHash 2 senaryo (12-hex regex + `JSON.stringify(row).not.toContain(rawUserId)` negatif kanıt; correlation = aynı userId → aynı hash farklı event'lerde).
- **`backend/src/kvkk/consent.test.ts` 4 PASS** — granted → getActiveConsent true + 1 row PASS; granted+revoked → false + iki event hala DB'de append-only kanıtı; denormalized cache senkron — kvkkConsentAt + healthConsentAt set+null geçişleri + auto_revoked da null; pazarlama_iletisim User cache'e dokunmaz ama getActiveConsent doğru (truth source).
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` **38 PASS** (önceki 26 + yeni 12). `pnpm typecheck` (recursive) temiz. `pnpm lint` temiz (auto-fix 2 dosya import sırası). `pnpm format:check` temiz. `pnpm -F @alpfit/shared test` 41 PASS + `pnpm -F @alpfit/mobile test` 23 PASS regresyon yok. DECISIONS.md "KVKK Consent Versiyonlu + AuditLog Whitelist Metadata + UserIdHash" kararı eklendi (textVersion tarih-bazlı vs semver, metadata whitelist vs blacklist, raw userId vs hash 3 ana karar + risk-mitigation). Karar noktaları "best practice" altında task dokümanındaki önerilerle hizalı çözüldü (sormadan).

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

**Aktif Task:** Yok — TASK-1.14 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.15` (Soft delete + 30 gün retention job)

---

**Son Güncelleme:** 2026-05-29 — TASK-1.14 ✅: KVKK consent + audit log şeması yerleşti — `ConsentType` + `ConsentEventType` + `AuditEventType` (16 v1 event) enum'ları + `ConsentRecord` (versiyonlu append-only, `textVersion` + `ipAddress`/`userAgent` KVKK denetim için) + `AuditLog` (`userIdHash` sha256 prefix 12 hex, metadata Json? zod whitelist, ham userId DB'de YOK); migration `20260529205040_kvkk_consent_audit` saf Prisma DDL (2 enum + 2 tablo + 6 index + 1 FK); `backend/src/kvkk/consent.ts` `recordConsent` `$transaction` ile event insert + User denormalized cache + `getActiveConsent` truth-source query; `backend/src/kvkk/audit.ts` `AuditMetadataSchema` zod `.strict()` 10 izinli alan + `logAuditEvent` `hashUserId` pii-scrubber re-use (Sentry correlation hizalı); `shared/src/pii-fields.ts` `ip`/`ipAddress`/`userAgent` eklendi; 12 integration test PASS (audit: PII zod reddi + DB'ye yazılmama + whitelist kabul + hash 12-hex + correlation; consent: granted/revoked append-only + denormalized cache senkron + pazarlama cache YOK); backend 38 / shared 41 / mobile 23 PASS regresyon yok; typecheck + lint + format temiz; sıradaki TASK-1.15 soft delete + 30 gün retention job.
