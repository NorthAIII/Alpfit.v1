# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.24 ✅: Davet kabul + preview. `POST /invitations/:code/accept` (auth) → tek-kullanım atomik compare-and-set (`updateMany WHERE status='pending'`, count=0 → 409) + `createPtMemberRelation` (P2002 → 409 already_has_trainer) + audit `invitation_accepted`; sıra: 404 (yok/PT soft-deleted) → 410 expired → 409 already_used → 410 cancelled → 400 own_invitation (role 403'ten ÖNCE) → 403 onlyMember → 409 already_has_trainer; 200 `{trainerId,trainerFirstName,trainerLastName}`. `GET /invitations/:code` public preview → PT ad/soyad + expiresAt (PII düşük). `relations.ts` helper'lar dolduruldu. backend 148 PASS, typecheck/lint/format temiz. Sıradaki lineer TASK-1.25 (deep link).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 25/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.25 deep link
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

**Task:** Yok — TASK-1.24 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.25 (deep link) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.25` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 25 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.23 | PT davet linki üretim endpoint (+ liste + iptal) | ✅ Tamamlandı |
| 1.24 | Davet kabul + preview endpoint (PT-Member ilişki) | ✅ Tamamlandı |
| 1.25 | M1 Auth backend (deep link) | ⬜ Bekliyor (1) |
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

### TASK-1.24 — Davet kabul + preview endpoint (2026-05-30) ✅

- **`POST /invitations/:code/accept` (`routes/invitations-accept.ts` YENİ)** — auth korumalı. Doğrulama sırası: 404 (davet yok / PT soft-deleted) → 410 expired (lazy `markIfExpired`) → 409 already_used → 410 cancelled → **400 own_invitation (role 403'ten ÖNCE)** → 403 onlyMember → 409 already_has_trainer. Kabul atomik `$transaction`: compare-and-set `updateMany WHERE status='pending'` (count=0 → `InvitationRaceLostError` → 409) + `createPtMemberRelation` (P2002 → 409) + audit `invitation_accepted` (metadata `invitationId`). 200 `{trainerId,trainerFirstName,trainerLastName}`.
- **`GET /invitations/:code` (`routes/invitations-preview.ts` YENİ)** — public (auth yok). 404 (yok/PT soft-deleted) / 410 expired·cancelled·accepted / 200 `{trainerFirstName,trainerLastName,expiresAt}`. PII: yalnızca PT ad+soyad (bilinçli — üye PT doğrular); telefon/üye verisi yok.
- **`auth/relations.ts` (GÜNCELLE)** — placeholder dolduruldu: `getActivePtForMember` (soft-deleted PT filtreli) / `assertNoActivePt` / `createPtMemberRelation` (tx uyumlu); `assertSingleActivePtForMember` alias korundu. errors.json invite mesajları F1.1 diline güncellendi.
- Test ✅ — backend **148 PASS** (accept 10 + preview 6; concurrent race dahil). typecheck/lint/format temiz.

### TASK-1.23 — PT davet linki üretim endpoint (+ liste + iptal) (2026-05-30) ✅

- **`Invitation` modeli + migration (YENİ)** — `InvitationStatus` enum (pending/accepted/expired/cancelled), `code @unique` + `trainerId` FK + `acceptedByUserId?` + `expiresAt` + audit timestamp'leri; `@@index([trainerId,status])`/`([code])`/`([expiresAt])`. Helper'lar: `invitations/code.ts` (`generateInvitationCode` 6 char Crockford base32, modulo bias yok; `buildInvitationUrl`), `invitations/expiry.ts` (`markIfExpired` lazy, cron yok), `invitations/guard.ts` (`ensureTrainer` → 403).
- **3 route (`server.ts`'e register)** — `POST /invitations` (trainer-only, gövdesiz, P2002 retry max 3, audit `invitation_created` metadata yalnız `invitationId`, 201 `{id,code,url,expiresAt}`); `GET /invitations` (pending + lazy-expire düşür, en yeni önce); `DELETE /invitations/:id` (yok 404 / başka PT 403 / non-pending 409 / atomik compare-and-set cancel 204).
- **Env:** `APP_BASE_URL` (zod `.url()` default `https://alpfit.app`) → `env.ts` + `.env.example` + test stub. errors.json `invite.forbidden`/`invite.notCancellable`.
- Test ✅ — backend **131 PASS** (118 + 13). typecheck/lint/format temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.24 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.25` (deep link)
