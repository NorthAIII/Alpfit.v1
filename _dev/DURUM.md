# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.22 ✅: Logout endpoint'leri. `POST /auth/logout` (access korumalı, body `{refreshToken}`) → hash lookup + userId match (cross-user **403**), idempotent (bilinmeyen/zaten-revoke **204**), gerçek revoke atomik compare-and-set (`revokedReason:'logout'`) + `user_logout` audit. `POST /auth/logout-all` → kullanıcının tüm aktif token'ları batch `updateMany` (`logout_all`), `user_logout_all` audit her zaman (metadata `count`). Access token 15dk TTL ile yaşar (stateless JWT, kabul). errors.json `logoutTokenForbidden`. backend 118 PASS, typecheck/lint/format temiz. Sıradaki lineer TASK-1.23 (M1 davet linki).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 23/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.23 PT davet linki üretim endpoint
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

**Task:** Yok — TASK-1.22 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.23 (PT davet linki üretim endpoint) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.23` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 23 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.21 | Refresh token rotation (opaque 30 gün + aile + replay detection) | ✅ Tamamlandı |
| 1.22 | Logout + tüm cihazlardan çıkış endpoint'leri | ✅ Tamamlandı |
| 1.23–1.25 | M1 Auth backend (davet linki, davet kabul, deep link) | ⬜ Bekliyor (3) |
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

### TASK-1.22 — Logout + tüm cihazlardan çıkış endpoint'leri (2026-05-30) ✅

- **`POST /auth/logout` (`routes/auth-logout.ts` YENİ)** — access korumalı, body `{refreshToken}`. Hash lookup → `userId` match (başka kullanıcı → **403** `forbidden`, hedef token dokunulmaz). Idempotent: bilinmeyen/zaten-revoke → **204** (yeni audit yok). Gerçek revoke atomik compare-and-set (`updateMany WHERE id=? AND revokedAt IS NULL`, race'te çift audit önler) + `revokedReason:'logout'` + `user_logout` audit.
- **`POST /auth/logout-all` (`routes/auth-logout-all.ts` YENİ)** — access korumalı, kullanıcının tüm `revokedAt IS NULL` token'ları tek `updateMany` (`logout_all`). `user_logout_all` audit **her zaman** (metadata `count`=revoke sayısı, PII yok). Access token 15dk TTL ile yaşar (stateless JWT; logout-all access revoke etmez — `me` 200 ile doğrulandı).
- errors.json `auth.logoutTokenForbidden` eklendi; iki route `server.ts`'e kaydedildi.
- Test ✅ — backend **118 PASS** (107 + 11: logout 6 / logout-all 5). typecheck/lint/format temiz.

### TASK-1.21 — Refresh token rotation (opaque 30 gün + aile + replay detection) (2026-05-30) ✅

- **`RefreshToken` modeli + migration (YENİ)** — opaque token, DB'de yalnızca `tokenHash @unique` (sha256); `familyId` (aile/device) + `previousId` (rotation chain) + `revokedAt`/`revokedReason` + `deviceInfo Json?`. `@@index([userId])`/`([familyId])`. `auth/refresh-token.ts`: `generateRefreshToken` (`randomBytes(32)` base64url), `hashRefreshToken`, `issueRefreshToken` (familyId yoksa yeni aile), `cleanupExpiredRefreshTokens` (helper-only, cron'a bağlı değil).
- **`POST /auth/refresh` (`routes/auth-refresh.ts` YENİ)** — tek `$transaction`: lookup → revoke'lu token (replay) → aile bütünü `replay_detected` (401) / expired (401) / atomik `updateMany WHERE revokedAt IS NULL` compare-and-set rotate (count=0 → race kaybı = replay) → yeni refresh (aynı aile) + yeni access. audit refresh_rotated/replay/expired (`refreshTokenId` whitelist). 400/401 sızdırmaz.
- **Entegrasyon** — `auth-otp-verify` (mevcut üye login) + `auth-profile` (yeni üye) artık refresh basar; profile token User create ile **aynı transaction'da** (rollback → orphan yok). errors.json `refreshInvalid`/`refreshExpired`/`refreshReplay`. Mevcut test beforeEach'lerine `refreshToken.deleteMany` (FK).
- Test ✅ — backend **107 PASS** (99 + 8: rotation/replay+aile/expired/invalid/400/aile-izolasyonu/concurrent-race/soft-delete). typecheck/lint/format temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.22 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.23` (PT davet linki üretim endpoint)
