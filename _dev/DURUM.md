# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.17 ✅: Mock SMS provider katmanı kuruldu — `SmsProvider` interface + `MockSmsProvider` (dev_otp_log'a yazar + pino redact'lı log) + `createSmsProvider` factory (env `SMS_PROVIDER` mock/live; live → Yakın 5 throw). `DevOtpLog` modeli + migration; `GET /internal/dev-otp/:phoneE164` dev OTP lookup (production→404, ADMIN_INTERNAL_TOKEN Bearer guard paylaşımlı, `extractBearer` → `routes/bearer.ts` DRY); OTP log/HTTP'ye `otpCode` adıyla gider (PII redact), ham `code` over-redaction önleme için listeye eklenmedi (DECISIONS "TASK-1.17"). Test: backend 63 PASS (52+11), shared 41 + mobile 23 regresyon, typecheck/lint/format temiz. Sıradaki TASK-1.18 OTP send endpoint (rate limit + Redis).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 17/34 task tamam; sıradaki TASK-1.18 OTP send endpoint (rate limit + Redis)
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

**Task:** Yok — TASK-1.17 ✅ tamamlandı, sıradaki TASK-1.18 (OTP send endpoint — rate limit + Redis) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.18` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 17 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.17 | Mock SMS provider interface + dev_otp_log | ✅ Tamamlandı |
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

### TASK-1.17 — Mock SMS provider interface + dev_otp_log (2026-05-30) ✅

- **SMS soyutlaması (`backend/src/sms/`)** — `SmsProvider` interface (`sendOtp(phoneE164, code, ttlSec)`) + `MockSmsProvider` (dev_otp_log'a yazar, pino'ya `otpCode` redact'lı log düşer, `mock-<uuid>` döner) + `createSmsProvider` factory (env `SMS_PROVIDER` mock/live; `live` → Yakın 5 throw, exhaustive `never` guard). Tüm SMS çağrıları interface'ten geçer → Live driver Yakın 5'te tek dosya + env değeriyle eklenir.
- **`DevOtpLog` modeli + migration `20260529224347_dev_otp_log`** — `phoneE164`/`code` (plaintext, dev lookup okur)/`ttlSec`/`createdAt`/`consumedAt` + 2 index. Production'da BOŞ (Live driver row üretmez). `SMS_PROVIDER` env zod enum eklendi (.env.example + staging example).
- **`GET /internal/dev-otp/:phoneE164` (`routes/internal-dev-otp.ts`) + server register** — son OTP'yi `otpCode` alanıyla döner (mobile dev otomatik OTP girişi, TASK-1.30). Guard: production→404, token yok→503, eksik/yanlış token→401, kayıt yok→404. TASK-1.15 `ADMIN_INTERNAL_TOKEN` paylaşımlı; `extractBearer` → `routes/bearer.ts`'e çıkarıldı (DRY, admin-internal de kullanır).
- **PII (`shared/src/pii-fields.ts`)** — OTP log/HTTP'ye hep `otpCode` adıyla gider (zaten redact); generic `code` BİLİNÇLİ eklenmedi (pg/HTTP hata kodları log'da okunabilir kalsın — over-redaction önleme). DECISIONS "TASK-1.17" Karar 4.
- Test ✅ — backend **63 PASS** (52 + 11 yeni: mock insert/log-redact 2 + factory mock/live 2 + endpoint dev/prod/auth/503 7). `pnpm typecheck` + `lint` + `format:check` temiz (1 import/order auto-fix). Regresyon: shared 41 + mobile 23 PASS. Karar noktası: console.log yerine pino logger (redact otomatik); PII field `otpCode` lehine açık gerekçeyle çözüldü.

### TASK-1.16 — Backblaze B2 yedek + restore drill prosedürü (2026-05-30) ✅

- **`_dev/docs/backblaze-setup.md` (YENİ)** — Backblaze B2 manuel hesap+bucket+lifecycle+key kurulum rehberi: EU Central region zorunluluğu (geri alınamaz ⚠️), bucket private + SSE-B2, lifecycle 30 gün hide + 1 gün delete (KVKK veri minimizasyonu), scoped application key (master key kullanılmaz), client-side encryption password+salt üretimi, Backblaze DPA imza formu, password manager pointer disiplini. Maliyet tablosu (~$0.02/ay v1) + sorun giderme + provider seçim matrisi (B2 vs AWS Glacier vs Hetzner Storage Box).
- **`_dev/docs/staging-pg-backup-cron.md` (YENİ)** — rclone install (B2 native driver, S3-uyumlu form alternatif) + non-interaktif config yazımı (B2 + crypt overlay, `rclone obscure` ile config dosyasında obfuscation, plain values shell history'den temizlenir) + smoke test (`rclone lsd`/`ls`/`rcat`/`cat` ile crypt overlay doğrulama) + `/usr/local/bin/alpfit-pg-backup.sh` template (`pg_dump --format=custom --single-transaction --no-owner --no-privileges --compress=6` → `/var/backups/alpfit/staging-YYYY-MM-DD.dump`, sanity guard `<1KB exit 2`, `rclone copy alpfit-b2-crypt: --transfers=1 --retries=3`, local 7-gün `find -mtime +7 -delete`) + crontab `0 2 * * *` UTC (TR 05:00 — retention purge UTC 00:00'dan 2 saat sonra; purge edilmiş hali yedeklenir) + logrotate haftalık×8 + doğrulama checklist.
- **`_dev/docs/restore-drill.md` (YENİ)** — Aylık restore drill prosedürü 7 adım: SSH `deploy@178.104.140.36` → rclone B2'den son dump indir (`head -c 5` PGDMP magic byte sanity check) → ayrı `restore_test` DB oluştur (production'a dokunulmaz) → `docker cp` + `docker compose exec pg_restore --exit-on-error --verbose` (elapsed ölçer) → smoke query (`\dt` tablo listesi + `User count` + `AuditLog count + MAX(occurredAt)` + `_prisma_migrations` son migration adı) → temizlik (`DROP DATABASE restore_test` + dump dosyası sil) → drill kaydı `staging-infra.md`'ye (✅/❌ + süre + smoke özet). Hızlı komut özeti aşağıda referans için.
- **`_dev/memory/restore-drill-disiplini.md` (YENİ)** — Süreç Disiplinleri kategorisinde aylık drill kuralı: her ayın 15'i hedef tarih (hatırlama kolay, ay ortası garanti tetiklenir), prosedür restore-drill.md, drift sinyalleri (B2 bucket boyutu sabit, log FAIL ardışık, local buffer dünkü dump yok), aksilik → `/devflow:quick` task; faz review-phase'lerinde "son drill başarılı mı" kontrol; bu projeye özgü (DevFlow geneli değil → faz retrosu).
- **`_dev/memory/staging-infra.md` UPDATE** — "B2 Off-Site Yedek" tablosu (provider/region/endpoint/bucket/key+encryption pointer'ları/lifecycle/local buffer/cron/script/log/DPA tarihi — TBD alanları kullanıcı follow-up'da doldurur) + "Restore Drill Kayıtları" boş bölüm + "Yedekleme" rehber link'lerine güncellendi + TODO 3 follow-up'a bölündü (B2 hesap, cron deploy, ilk drill).
- **`_dev/MEMORY.md` + `_dev/KVKK.md` + `_dev/docs/DECISIONS.md`** — MEMORY index pointer `restore-drill-disiplini` + son güncelleme; KVKK "Üçüncü Taraf Sözleşmeler" listesinde B2 region kararı ✅ (eu-central-003 SCC + DPA savunulabilir, mekanizma özeti, ~$0.02/ay) + ayrı DPA TODO; DECISIONS.md "TASK-1.16" karar (5 seçenek matrisi: provider/mekanizma/encryption/lifecycle/drill sıklığı + 8 tamamlayıcı + 4 ILKELER gerekçe + 6 risk-mitigation + 6 follow-up kullanıcı manuel adımı).
- Test kriterleri ✅ — `bash -n` script blokları temiz (backup script 59 satır + rclone config + drill snippet). Regresyon: backend 52 PASS + shared 41 PASS + mobile 23 PASS (snapshot dahil). `pnpm typecheck` (recursive) + `pnpm lint` + `pnpm format:check` temiz. AskUserQuestion 3 karar: (1) script + host crontab (önerilen, TASK-1.15 paterniyle), (2) B2 hesabı sonra kurulacak (manuel TODO), (3) ilk drill sonraya (kullanıcı kendisi yapar, memory'ye yazar). Follow-up: B2 hesap+bucket+key+DPA, rclone install+config+script deploy+crontab, ilk restore drill — sonuçlar `staging-infra.md`'ye yazılır.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.17 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.18` (OTP send endpoint — rate limit + Redis)
