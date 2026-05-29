# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.16 ✅: Backblaze B2 off-site yedek + restore drill prosedürü dokümantasyon teslim edildi — Coolify-bağımsız mekanizma (TASK-1.10 sapması uyumlu): host VPS crontab + `docker compose exec pg_dump` + rclone (B2 native driver + crypt overlay client-side AES); `_dev/docs/backblaze-setup.md` (manuel hesap+EU bucket+lifecycle 30g+scoped key+DPA), `_dev/docs/staging-pg-backup-cron.md` (rclone install+non-interaktif config+`/usr/local/bin/alpfit-pg-backup.sh` template — pg_dump custom format/single-transaction/no-owner/compress=6, sanity guard <1KB exit 2, crontab UTC 02:00=TR 05:00 retention purge'den 2 saat sonra, local 7g buffer, logrotate haftalık×8), `_dev/docs/restore-drill.md` (7-adım: rclone indir+PGDMP magic byte sanity → restore_test ayrı DB → pg_restore --exit-on-error+elapsed → smoke query `\dt`/User count/AuditLog count+MAX/_prisma_migrations → temizlik+drill kaydı); `_dev/memory/restore-drill-disiplini.md` (her ayın 15'i süreç disiplini, drift sinyalleri, faz review-phase kontrolü); `_dev/memory/staging-infra.md` "B2 Off-Site Yedek" tablosu (TBD alanları kullanıcı follow-up) + "Restore Drill Kayıtları" boş başlangıç + TODO 3 follow-up'a bölündü; `_dev/MEMORY.md` index pointer + son güncelleme; `_dev/KVKK.md` B2 region kararı ✅ (eu-central-003 SCC+DPA savunulabilir) + ayrı DPA TODO; DECISIONS.md "TASK-1.16" karar (5 seçenek matrisi provider/mekanizma/encryption/lifecycle/drill sıklığı + 8 tamamlayıcı + 4 ILKELER gerekçesi + 6 risk-mitigation + 6 follow-up). AskUserQuestion 3 karar: script+host crontab (önerilen), B2 sonra kurulacak, ilk drill sonraya. Test paketleri regresyon: backend 52 + shared 41 + mobile 23 PASS, typecheck/lint/format temiz; bash -n script blokları syntax temiz. Sıradaki TASK-1.17 Mock SMS provider interface + dev_otp_log.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 16/34 task tamam; sıradaki TASK-1.17 Mock SMS provider interface + dev_otp_log
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

**Task:** Yok — TASK-1.16 ✅ tamamlandı, sıradaki TASK-1.17 (Mock SMS provider interface + dev_otp_log) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.17` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 16 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.16 | Backblaze B2 yedek + restore drill prosedürü | ✅ Tamamlandı |
| 1.17 | Mock SMS provider interface + dev_otp_log | ⬜ Bekliyor |
| 1.18–1.25 | M1 Auth backend (OTP, JWT, refresh, davet, deep link) | ⬜ Bekliyor (8) |
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

### TASK-1.16 — Backblaze B2 yedek + restore drill prosedürü (2026-05-30) ✅

- **`_dev/docs/backblaze-setup.md` (YENİ)** — Backblaze B2 manuel hesap+bucket+lifecycle+key kurulum rehberi: EU Central region zorunluluğu (geri alınamaz ⚠️), bucket private + SSE-B2, lifecycle 30 gün hide + 1 gün delete (KVKK veri minimizasyonu), scoped application key (master key kullanılmaz), client-side encryption password+salt üretimi, Backblaze DPA imza formu, password manager pointer disiplini. Maliyet tablosu (~$0.02/ay v1) + sorun giderme + provider seçim matrisi (B2 vs AWS Glacier vs Hetzner Storage Box).
- **`_dev/docs/staging-pg-backup-cron.md` (YENİ)** — rclone install (B2 native driver, S3-uyumlu form alternatif) + non-interaktif config yazımı (B2 + crypt overlay, `rclone obscure` ile config dosyasında obfuscation, plain values shell history'den temizlenir) + smoke test (`rclone lsd`/`ls`/`rcat`/`cat` ile crypt overlay doğrulama) + `/usr/local/bin/alpfit-pg-backup.sh` template (`pg_dump --format=custom --single-transaction --no-owner --no-privileges --compress=6` → `/var/backups/alpfit/staging-YYYY-MM-DD.dump`, sanity guard `<1KB exit 2`, `rclone copy alpfit-b2-crypt: --transfers=1 --retries=3`, local 7-gün `find -mtime +7 -delete`) + crontab `0 2 * * *` UTC (TR 05:00 — retention purge UTC 00:00'dan 2 saat sonra; purge edilmiş hali yedeklenir) + logrotate haftalık×8 + doğrulama checklist.
- **`_dev/docs/restore-drill.md` (YENİ)** — Aylık restore drill prosedürü 7 adım: SSH `deploy@178.104.140.36` → rclone B2'den son dump indir (`head -c 5` PGDMP magic byte sanity check) → ayrı `restore_test` DB oluştur (production'a dokunulmaz) → `docker cp` + `docker compose exec pg_restore --exit-on-error --verbose` (elapsed ölçer) → smoke query (`\dt` tablo listesi + `User count` + `AuditLog count + MAX(occurredAt)` + `_prisma_migrations` son migration adı) → temizlik (`DROP DATABASE restore_test` + dump dosyası sil) → drill kaydı `staging-infra.md`'ye (✅/❌ + süre + smoke özet). Hızlı komut özeti aşağıda referans için.
- **`_dev/memory/restore-drill-disiplini.md` (YENİ)** — Süreç Disiplinleri kategorisinde aylık drill kuralı: her ayın 15'i hedef tarih (hatırlama kolay, ay ortası garanti tetiklenir), prosedür restore-drill.md, drift sinyalleri (B2 bucket boyutu sabit, log FAIL ardışık, local buffer dünkü dump yok), aksilik → `/devflow:quick` task; faz review-phase'lerinde "son drill başarılı mı" kontrol; bu projeye özgü (DevFlow geneli değil → faz retrosu).
- **`_dev/memory/staging-infra.md` UPDATE** — "B2 Off-Site Yedek" tablosu (provider/region/endpoint/bucket/key+encryption pointer'ları/lifecycle/local buffer/cron/script/log/DPA tarihi — TBD alanları kullanıcı follow-up'da doldurur) + "Restore Drill Kayıtları" boş bölüm + "Yedekleme" rehber link'lerine güncellendi + TODO 3 follow-up'a bölündü (B2 hesap, cron deploy, ilk drill).
- **`_dev/MEMORY.md` + `_dev/KVKK.md` + `_dev/docs/DECISIONS.md`** — MEMORY index pointer `restore-drill-disiplini` + son güncelleme; KVKK "Üçüncü Taraf Sözleşmeler" listesinde B2 region kararı ✅ (eu-central-003 SCC + DPA savunulabilir, mekanizma özeti, ~$0.02/ay) + ayrı DPA TODO; DECISIONS.md "TASK-1.16" karar (5 seçenek matrisi: provider/mekanizma/encryption/lifecycle/drill sıklığı + 8 tamamlayıcı + 4 ILKELER gerekçe + 6 risk-mitigation + 6 follow-up kullanıcı manuel adımı).
- Test kriterleri ✅ — `bash -n` script blokları temiz (backup script 59 satır + rclone config + drill snippet). Regresyon: backend 52 PASS + shared 41 PASS + mobile 23 PASS (snapshot dahil). `pnpm typecheck` (recursive) + `pnpm lint` + `pnpm format:check` temiz. AskUserQuestion 3 karar: (1) script + host crontab (önerilen, TASK-1.15 paterniyle), (2) B2 hesabı sonra kurulacak (manuel TODO), (3) ilk drill sonraya (kullanıcı kendisi yapar, memory'ye yazar). Follow-up: B2 hesap+bucket+key+DPA, rclone install+config+script deploy+crontab, ilk restore drill — sonuçlar `staging-infra.md`'ye yazılır.

### TASK-1.15 — Soft delete + 30 gün retention job (2026-05-30) ✅

- **`backend/src/kvkk/soft-delete.ts` (YENİ)** — Üç giriş noktası, hepsi atomik `$transaction` ile audit yazar: `softDeleteUser` (deletedAt + retentionDeadline + AuditLog member_removed) / `endTrainerMember` (TrainerMember.endedAt + member.retentionDeadline, deletedAt SET EDİLMEZ → hesap kalır) / `revokeHealthConsent` (ConsentRecord saglik_verisi/revoked append-only + healthConsentAt null + retentionDeadline + AuditLog consent_revoked). `RETENTION_DAYS = 30` SSOT export. `logAuditEvent` imzası `AuditLogClient = Pick<PrismaClient, 'auditLog'>` yapısal tipe genişledi (tx + full PrismaClient ikisi de geçer; eski TASK-1.14 testleri değişmeden geçer).
- **`backend/src/kvkk/retention-job.ts` (YENİ)** — `runRetentionPurge(prisma)` deadline geçen User'ları kendi `$transaction`'ında işler; `deletedAt IS NOT NULL` → ANONİMİZE (firstName='', lastName='', profilePhotoUrl=null, gymName=null, certificateNote=null, `phoneE164='deleted_<sha256-12hex>'` — `+` ile başlamayan canlı E.164 ile çakışma matematiksel olarak imkansız), aksi halde sadece `retentionDeadline = null` reset (sağlık-purge yolu, hesap kalır). `purgeDeletableTablesForUser(_tx, _userId)` v1'de boş imza (Yakın 4'te M6 tablolar eklenir). Toplu AuditLog `retention_purge` event'i `userId='retention-job'` sentinel hash + `count` + `reason` whitelist metadata.
- **`backend/src/routes/admin-internal.ts` (YENİ) + `server.ts` register** — `POST /admin/internal/retention-purge` Bearer auth: 503 (env yok), 401 (header eksik / yanlış token / Bearer prefix yok), 200 (`{status, report}`). Plugin factory `adminInternalRoutes({env})` env'i closure'a alır. **Endpoint internet'e açık değil** — bunker-nginx server block'unda `/admin/internal/` proxy edilmez; tek erişim yolu container içinden `docker compose exec`.
- **`config/env.ts` + `.env.example` + `_ops/staging/.env.staging.example`** — `ADMIN_INTERNAL_TOKEN: z.string().min(32).optional()` eklendi (dev/test'te optional — endpoint 503 ile düzgün degrade; staging/prod'da set edilir, üretim komutu `openssl rand -hex 32` örnekte).
- **`_dev/docs/staging-retention-cron.md` (YENİ)** — Host VPS crontab (deploy user) → `/usr/local/bin/alpfit-retention-purge.sh` → `docker compose exec alpfit-backend curl` deseniyle Coolify-bağımsız (TASK-1.10 mimari sapma) tetikleme rehberi: token üretim, .env.staging insert, container restart smoke, script exit code + log + logrotate, `0 0 * * *` UTC (03:00 TR), manuel test, rollback. "bunker-nginx server block'una /admin/internal/ proxy etme" disiplini yazılı (KVKK saldırı yüzeyi 0).
- **`_dev/KVKK.md` "Veri Saklama Politikası" + DECISIONS.md karar + memory `feedback-snapshot-tarih-pin.md`** — KVKK.md 3 akış tablosu + anonimizasyon stratejisi + audit retention TODO + host crontab tetikleme; DECISIONS.md "TASK-1.15: 30 Gün Retention Purge + Anonimizasyon vs Hard Delete + Host Crontab Tetikleme" kararı (3 ana karar + 7 tamamlayıcı + 4 risk-mitigation); memory'ye süreç disiplini — UI snapshot testlerinde tarih/zaman içeren render'lar `jest.useFakeTimers().setSystemTime(...)` ile pin'lenmeli.
- **`backend/src/kvkk/retention-job.test.ts` 14 PASS** — 3 soft-delete helper davranışı (cache + AuditLog + metadata) + 5 runRetentionPurge senaryosu (deadline-geçmemiş-skip, anonimize+AuditLog, sadece-reset, v1.5-ready-boş, idempotent) + 1 env-yok 503 + 5 endpoint senaryosu (401 üç çeşit, 200 boş, 200 gerçek anonimize). **Yan fix:** mobile `landing-screen.test.tsx` snapshot drift (pre-existing test smell — `formatTrDate(new Date())` snapshot'ta sabitti) `jest.useFakeTimers().setSystemTime(2026-05-29T12:00:00Z)` ile pin'lendi.
- Test kriterleri ✅ — `pnpm -F @alpfit/backend test` **52 PASS** (önceki 38 + yeni 14). `pnpm typecheck` (recursive) temiz. `pnpm lint` + `pnpm format:check` temiz (1 prettier auto-fix). `pnpm -F @alpfit/shared test` 41 PASS + `pnpm -F @alpfit/mobile test` 23 PASS (snapshot drift fix sonrası). Karar noktaları AskUserQuestion ile netleşti: (1) anonimize (önerilen), (2) host crontab (önerilen), (3) sadece rehber + endpoint (önerilen) + yan fix mobile snapshot pin onaylandı.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.16 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.17` (Mock SMS provider interface + dev_otp_log)
