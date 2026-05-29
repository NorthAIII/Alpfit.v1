# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.20 ✅: JWT access token + auth middleware + profil create. `@fastify/jwt` (HS256, access 15dk; kayıt jetonu 10dk — `typ` claim ayrımı). `auth/jwt.ts` issue helper'ları + `auth/middleware.ts` `app.authenticate` (jwtVerify→typ:access→DB deletedAt:null). `GET /auth/me` (korumalı). `POST /auth/profile` tek `$transaction` (User+ConsentRecord+audit, kvkk zorunlu/403, telefon var/409). verify mevcut user→accessToken+user_login / yeni user→registrationToken. Akış: kullanıcı **kayıt jetonu** yaklaşımını seçti (OTP tek-kullanımlık korundu). backend 99 PASS (81+18), typecheck/lint/format temiz. Sıradaki lineer TASK-1.21 (refresh token rotation).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 21/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.21 refresh token rotation
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

**Task:** Yok — TASK-1.20 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.21 (refresh token rotation — 30 gün + replay detection) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.21` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 21 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.18 | OTP send endpoint (rate limit + Redis) | ✅ Tamamlandı |
| 1.19 | OTP verify endpoint (brute force 5→15dk kilit) | ✅ Tamamlandı |
| 1.20 | JWT access token + auth middleware + profil create | ✅ Tamamlandı |
| 1.21–1.25 | M1 Auth backend (refresh, logout, davet, deep link) | ⬜ Bekliyor (5) |
| 1.26–1.27 | M1 Mobile UI (açılış ekranı, telefon girişi) | ⬜ Bekliyor (2) |
| 1.28 | KVKK rıza ekranı (2 tickbox + placeholder metin) | ✅ Tamamlandı (sıra dışı) |
| 1.29–1.34 | M1 Mobile UI + akış + smoke (OTP ekranı, profil, PT üyeler tab, banner, auto-login, e2e smoke) | ⬜ Bekliyor (6) |

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

### TASK-1.20 — JWT access token + auth middleware + profil create (2026-05-30) ✅

- **`auth/jwt.ts` + `auth/middleware.ts` (YENİ)** — `@fastify/jwt` (HS256). İki token tek secret, `typ` claim ayrımı: `access` (sub=userId+role, 15dk) / `registration` (sub=phone, 10dk). `issueAccessToken`/`issueRegistrationToken` (`jti`=randomUUID). `app.authenticate` decorator: `jwtVerify`→`typ:'access'` zorla→DB `deletedAt:null` aktiflik→401 sızdırmaz. `@fastify/jwt expiresIn` saniye (ampirik).
- **`routes/auth-profile.ts` + `auth-me.ts` (YENİ)** — `POST /auth/profile`: Bearer kayıt jetonu → tek `$transaction` (User+ConsentRecord[kvkk zorunlu/saglik opsiyonel]+audit user_created+consent_granted). 401/400/403 kvkk/409 telefon(+P2002 race)/201. `GET /auth/me` korumalı (auto-login TASK-1.33). `auth-otp-verify` GÜNCELLE: mevcut user→accessToken+user_login / yeni→registrationToken.
- **Akış kararı (kullanıcıya soruldu):** Plan çelişkisi (profil OTP'yi tekrar doğrula ama verify zaten consume ediyor) → **kayıt jetonu** seçildi; TASK-1.19 tek-kullanımlık consume semantiği + testleri korundu. (DECISIONS "TASK-1.20".)
- Test ✅ — backend **99 PASS** (81 + 18: jwt 4 / middleware 5 / auth-profile 7 / verify +2). typecheck/lint/format temiz. errors.json (`kvkkConsentRequired`/`phoneAlreadyRegistered`) + `KVKK_TEXT_VERSION` export.

### TASK-1.19 — OTP verify endpoint + brute force (5 hatalı = 15dk kilit) (2026-05-30) ✅

- **`POST /auth/otp/verify` (`routes/auth-otp-verify.ts` YENİ)** — sıra: kilit kontrolü (`otp:lockout` varsa 423 + `Retry-After`, `otp_verify_failed` reason:'locked') → `peekOtp` (kayıt yok → 410 expired) → `codesMatch` (timingSafeEqual). Yanlış kod → `otp:attempts` atomik INCR + audit (attemptCount), 5'e ulaşınca `otp:lockout` 15dk SET + OTP/sayaç temizle (423), öncesi 401. Doğru kod → atomik `GETDEL` consume (concurrent race → 410) + `otp_verified` audit + dev_otp_log consumedAt + aktif user lookup → `{verified,userExists,isNew}`. JWT TASK-1.20'de eklendi.
- **`auth/otp.ts` (GÜNCELLE)** — verify helper'ları: `otpAttemptsKey`/`otpLockoutKey`, `OTP_MAX_ATTEMPTS=5`/`OTP_LOCKOUT_SEC=900`, `getLockoutTtl`/`peekOtp`/`consumeOtp` (GETDEL)/`registerFailedAttempt` (INCR+ilk-expire)/`lockoutPhone`/`clearAttempts`/`codesMatch`. **`OtpRecord.attempts` kaldırıldı** — sayım JSON read-modify-write yarışı yerine ayrı atomik `otp:attempts` key'inde (send.test.ts assertion'ı buduldu).
- Test ✅ — backend **81 PASS** (70 + 11 verify). typecheck/lint/format temiz. errors.json `auth.otpExpired` eklendi.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.20 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.21` (refresh token rotation — 30 gün + replay detection)
