# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.15 ✅: Soft delete + 30 gün retention purge altyapısı yerleşti — `backend/src/kvkk/soft-delete.ts` üç giriş noktası (`softDeleteUser` → deletedAt + retentionDeadline + AuditLog member_removed; `endTrainerMember` → relation endedAt + member retentionDeadline; `revokeHealthConsent` → ConsentRecord revoked + cache null + retentionDeadline + AuditLog consent_revoked) `$transaction` içinde audit ile atomik; `backend/src/kvkk/retention-job.ts` `runRetentionPurge` deadline geçen User'ları işler (`deletedAt IS NOT NULL` → anonimize: firstName/lastName/profilePhotoUrl/gymName/certificateNote null + phoneE164=`deleted_<sha256-12hex>` collision-safe + retentionDeadline null; aksi → sadece deadline reset/sağlık-purge); `purgeDeletableTablesForUser(_tx, _userId)` v1'de boş imza (Yakın 4 tablo ekleyecek); her user kendi transaction'ında + toplu AuditLog `retention_purge` userId='retention-job' sentinel hash; `backend/src/routes/admin-internal.ts` `POST /admin/internal/retention-purge` Bearer auth (503 env yok, 401 token, 200 report); `logAuditEvent` imzası `AuditLogClient = Pick<PrismaClient, 'auditLog'>` yapısal tipe genişledi (tx + full client); env+`.env.example`+`.env.staging.example` `ADMIN_INTERNAL_TOKEN` (32+ char optional); `_dev/docs/staging-retention-cron.md` host VPS crontab (deploy user) → `docker compose exec` → curl rehberi (Coolify YOK / TASK-1.10 sapma, endpoint internet'e açık değil); `_dev/KVKK.md` "Veri Saklama Politikası" bölümü; DECISIONS.md "TASK-1.15" karar (anonimize vs hard delete vs hibrit, tek retentionDeadline + deletedAt akıbet ayrımı, host crontab vs Coolify/GH Actions/node-cron/ek container); yan fix mobile snapshot drift (landing-screen.test.tsx fake timer ile 2026-05-29 pin'lendi → her gün CI fail yok), memory `feedback-snapshot-tarih-pin.md` süreç disiplini; backend 52 PASS (önceki 38 + 14 yeni: 3 helper + 5 retention + 6 endpoint), shared 41 + mobile 23 regresyon yok; typecheck + lint + format temiz; sıradaki TASK-1.16 Backblaze B2 yedek + restore drill.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 15/34 task tamam; sıradaki TASK-1.16 Backblaze B2 yedek + restore drill
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

**Task:** Yok — TASK-1.15 ✅ tamamlandı, sıradaki TASK-1.16 (Backblaze B2 yedek + restore drill prosedürü) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.16` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 15 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.15 | Soft delete + 30 gün retention job | ✅ Tamamlandı |
| 1.16 | Backblaze B2 yedek + restore drill prosedürü | ⬜ Bekliyor |
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

### TASK-1.15 — Soft delete + 30 gün retention job (2026-05-30) ✅

- **`backend/src/kvkk/soft-delete.ts` (YENİ)** — Üç giriş noktası, hepsi atomik `$transaction` ile audit yazar: `softDeleteUser` (deletedAt + retentionDeadline + AuditLog member_removed) / `endTrainerMember` (TrainerMember.endedAt + member.retentionDeadline, deletedAt SET EDİLMEZ → hesap kalır) / `revokeHealthConsent` (ConsentRecord saglik_verisi/revoked append-only + healthConsentAt null + retentionDeadline + AuditLog consent_revoked). `RETENTION_DAYS = 30` SSOT export. `logAuditEvent` imzası `AuditLogClient = Pick<PrismaClient, 'auditLog'>` yapısal tipe genişledi (tx + full PrismaClient ikisi de geçer; eski TASK-1.14 testleri değişmeden geçer).
- **`backend/src/kvkk/retention-job.ts` (YENİ)** — `runRetentionPurge(prisma)` deadline geçen User'ları kendi `$transaction`'ında işler; `deletedAt IS NOT NULL` → ANONİMİZE (firstName='', lastName='', profilePhotoUrl=null, gymName=null, certificateNote=null, `phoneE164='deleted_<sha256-12hex>'` — `+` ile başlamayan canlı E.164 ile çakışma matematiksel olarak imkansız), aksi halde sadece `retentionDeadline = null` reset (sağlık-purge yolu, hesap kalır). `purgeDeletableTablesForUser(_tx, _userId)` v1'de boş imza (Yakın 4'te M6 tablolar eklenir). Toplu AuditLog `retention_purge` event'i `userId='retention-job'` sentinel hash + `count` + `reason` whitelist metadata.
- **`backend/src/routes/admin-internal.ts` (YENİ) + `server.ts` register** — `POST /admin/internal/retention-purge` Bearer auth: 503 (env yok), 401 (header eksik / yanlış token / Bearer prefix yok), 200 (`{status, report}`). Plugin factory `adminInternalRoutes({env})` env'i closure'a alır. **Endpoint internet'e açık değil** — bunker-nginx server block'unda `/admin/internal/` proxy edilmez; tek erişim yolu container içinden `docker compose exec`.
- **`config/env.ts` + `.env.example` + `_ops/staging/.env.staging.example`** — `ADMIN_INTERNAL_TOKEN: z.string().min(32).optional()` eklendi (dev/test'te optional — endpoint 503 ile düzgün degrade; staging/prod'da set edilir, üretim komutu `openssl rand -hex 32` örnekte).
- **`_dev/docs/staging-retention-cron.md` (YENİ)** — Host VPS crontab (deploy user) → `/usr/local/bin/alpfit-retention-purge.sh` → `docker compose exec alpfit-backend curl` deseniyle Coolify-bağımsız (TASK-1.10 mimari sapma) tetikleme rehberi: token üretim, .env.staging insert, container restart smoke, script exit code + log + logrotate, `0 0 * * *` UTC (03:00 TR), manuel test, rollback. "bunker-nginx server block'una /admin/internal/ proxy etme" disiplini yazılı (KVKK saldırı yüzeyi 0).
- **`_dev/KVKK.md` "Veri Saklama Politikası" + DECISIONS.md karar + memory `feedback-snapshot-tarih-pin.md`** — KVKK.md 3 akış tablosu + anonimizasyon stratejisi + audit retention TODO + host crontab tetikleme; DECISIONS.md "TASK-1.15: 30 Gün Retention Purge + Anonimizasyon vs Hard Delete + Host Crontab Tetikleme" kararı (3 ana karar + 7 tamamlayıcı + 4 risk-mitigation); memory'ye süreç disiplini — UI snapshot testlerinde tarih/zaman içeren render'lar `jest.useFakeTimers().setSystemTime(...)` ile pin'lenmeli.
- **`backend/src/kvkk/retention-job.test.ts` 14 PASS** — 3 soft-delete helper davranışı (cache + AuditLog + metadata) + 5 runRetentionPurge senaryosu (deadline-geçmemiş-skip, anonimize+AuditLog, sadece-reset, v1.5-ready-boş, idempotent) + 1 env-yok 503 + 5 endpoint senaryosu (401 üç çeşit, 200 boş, 200 gerçek anonimize). **Yan fix:** mobile `landing-screen.test.tsx` snapshot drift (pre-existing test smell — `formatTrDate(new Date())` snapshot'ta sabitti) `jest.useFakeTimers().setSystemTime(2026-05-29T12:00:00Z)` ile pin'lendi.
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` **52 PASS** (önceki 38 + yeni 14). `pnpm typecheck` (recursive) temiz. `pnpm lint` + `pnpm format:check` temiz (1 prettier auto-fix). `pnpm -F @alpfit/shared test` 41 PASS + `pnpm -F @alpfit/mobile test` 23 PASS (snapshot drift fix sonrası). Karar noktaları AskUserQuestion ile netleşti: (1) anonimize (önerilen), (2) host crontab (önerilen), (3) sadece rehber + endpoint (önerilen) + yan fix mobile snapshot pin onaylandı.

### TASK-1.14 — KVKK consent schema + audit log (2026-05-29) ✅

- **Prisma schema** — 3 yeni enum (`ConsentType` kvkk_aydinlatma/saglik_verisi/pazarlama_iletisim; `ConsentEventType` granted/revoked/auto_revoked; `AuditEventType` 16 v1 event) + 2 yeni tablo: `ConsentRecord` (cuid, userId FK, consentType, eventType, `textVersion` tarih-bazlı string, `occurredAt` default now, opsiyonel `ipAddress`/`userAgent` KVKK denetim için bilinçli toplanır; index `userId+consentType`/`occurredAt`) + `AuditLog` (cuid, **`userIdHash` ham userId değil** sha256 prefix 12 hex, eventType, occurredAt, `metadata Json?`; index userIdHash/occurredAt/eventType). `User.consentRecords ConsentRecord[]` relation eklendi; mevcut `kvkkConsentAt`/`healthConsentAt` denormalized cache olarak kalır, truth source ConsentRecord query.
- **Migration `20260529205040_kvkk_consent_audit`** — Prisma `migrate dev --create-only` ile saf DDL (2 enum + 2 tablo + 6 index + 1 FK ConsentRecord→User). Raw SQL yok (TASK-1.13'tekinden farklı: partial unique index gereksinimi yok burada). `migrate deploy` ile DB'ye uygulandı; test/db.ts her suite için aynı komutu çalıştırdığından integration test'ler deploy garantisini doğrular.
- **`backend/src/kvkk/consent.ts` (YENİ)** — `recordConsent(prisma, args)` Prisma `$transaction` ile (a) ConsentRecord insert + (b) User denormalized cache update: `kvkk_aydinlatma` → `User.kvkkConsentAt`, `saglik_verisi` → `User.healthConsentAt`, `pazarlama_iletisim` → cache YOK (v1 alan yok); `granted` → `occurredAt`, `revoked`/`auto_revoked` → null. `getActiveConsent(prisma, userId, type)` en son event'i `orderBy occurredAt desc limit 1` ile çeker, `granted` mı kontrolü (truth source).
- **`backend/src/kvkk/audit.ts` (YENİ)** — `AuditMetadataSchema` zod **`.strict()` whitelist** 10 alan (`ip`/`deviceType`/`userAgent`/`invitationId`/`refreshTokenId`/`consentType`/`textVersion`/`attemptCount`/`count`/`reason`) — bilinmeyen anahtar ZodError fırlatır. `logAuditEvent(prisma, args)` — metadata varsa parse, `hashUserId(args.userId)` (pii-scrubber.ts'ten re-use: sha256 prefix 12 hex; **Sentry event correlation ile aynı algoritma** → audit ↔ Sentry hash hizalı), append-only insert. `null` literal'i Prisma 7 strict `Json?` tipinde reddedildiği için `validated === undefined` durumda field-omit (DB default NULL) — `Prisma.DbNull` yerine daha sade.
- **`shared/src/pii-fields.ts` (UPDATE)** — `ip`/`ipAddress`/`ip_address`/`userAgent`/`user_agent` eklendi (camelCase+snake_case SSOT). Inline yorum **IP audit nüansı**: ConsentRecord/AuditLog DB'sine bilinçli yazılır + AuditLog metadata zod whitelist'inde `ip`/`userAgent` izinli; ama log/Sentry yoluna sızarsa **pino redact + Sentry beforeSend** scrubber bunu yakalar. `kvkk-pii-scrubbing-matrisi.md` memory güncellendi.
- **`backend/src/kvkk/audit.test.ts` 8 PASS** — zod whitelist red 3 senaryo (`phone` + `weight` + `firstName`/`email` parseAsync) + `count() === 0` ile DB'ye row YAZILMADI kanıtı; whitelist içi kabul 3 senaryo (ip+deviceType, metadata-yok=null, consent event consentType+textVersion); userIdHash 2 senaryo (12-hex regex + `JSON.stringify(row).not.toContain(rawUserId)` negatif kanıt; correlation = aynı userId → aynı hash farklı event'lerde).
- **`backend/src/kvkk/consent.test.ts` 4 PASS** — granted → getActiveConsent true + 1 row PASS; granted+revoked → false + iki event hala DB'de append-only kanıtı; denormalized cache senkron — kvkkConsentAt + healthConsentAt set+null geçişleri + auto_revoked da null; pazarlama_iletisim User cache'e dokunmaz ama getActiveConsent doğru (truth source).
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` **38 PASS** (önceki 26 + yeni 12). `pnpm typecheck` (recursive) temiz. `pnpm lint` temiz (auto-fix 2 dosya import sırası). `pnpm format:check` temiz. `pnpm -F @alpfit/shared test` 41 PASS + `pnpm -F @alpfit/mobile test` 23 PASS regresyon yok. DECISIONS.md "KVKK Consent Versiyonlu + AuditLog Whitelist Metadata + UserIdHash" kararı eklendi (textVersion tarih-bazlı vs semver, metadata whitelist vs blacklist, raw userId vs hash 3 ana karar + risk-mitigation). Karar noktaları "best practice" altında task dokümanındaki önerilerle hizalı çözüldü (sormadan).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.15 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.16` (Backblaze B2 yedek + restore drill prosedürü)

---

**Son Güncelleme:** 2026-05-30 — TASK-1.15 ✅: Soft delete + 30 gün retention purge altyapısı yerleşti — `backend/src/kvkk/soft-delete.ts` üç giriş noktası (`softDeleteUser` / `endTrainerMember` / `revokeHealthConsent`) `$transaction` içinde audit ile atomik; `backend/src/kvkk/retention-job.ts` `runRetentionPurge` deadline geçen User'ları işler (deletedAt=null sade reset; deletedAt set → anonimize: PII null + phoneE164=`deleted_<sha256-12hex>` collision-safe); `purgeDeletableTablesForUser` v1'de boş imza (Yakın 4); her user kendi tx + toplu AuditLog `retention_purge` userId='retention-job' sentinel hash; `routes/admin-internal.ts` `POST /admin/internal/retention-purge` Bearer auth 401/503/200 — endpoint internet'e açık değil (container DNS only); `logAuditEvent` imzası `AuditLogClient` yapısal tip; `ADMIN_INTERNAL_TOKEN` 32+ char optional env + .env.example + .env.staging.example; `_dev/docs/staging-retention-cron.md` host crontab + `docker compose exec` rehberi (Coolify YOK, TASK-1.10 sapmasıyla uyumlu); KVKK.md "Veri Saklama Politikası" + DECISIONS.md karar (anonimize vs hard delete + retentionDeadline akıbet ayrımı + host crontab vs 4 alternatif); yan fix mobile snapshot drift (jest fake timer pin) + memory `feedback-snapshot-tarih-pin.md` süreç disiplini; backend 52 PASS (önceki 38 + 14 yeni: 3 helper + 5 retention + 6 endpoint), shared 41 + mobile 23 regresyon yok; typecheck + lint + format temiz; sıradaki TASK-1.16 Backblaze B2 yedek + restore drill.
