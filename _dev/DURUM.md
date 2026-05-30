# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.26 ✅: Açılış ekranı (`app/index.tsx`) — logo + tagline + "Üyeyim"/"Antrenörüm"/"Davetim var" üç buton; rol → `selectRole` + `/auth/phone`; "Davetim var" inline davet kodu input (TR-güvenli `trUpper`, 6 char, `ABC-123` mask) → preview valid ise `selectInvite` + navigate, değilse inline hata. Onboarding store (`src/onboarding/store.ts` YENİ, zustand 5 — kullanıcı onaylı; `exactOptionalPropertyTypes` için `| undefined` union). Deep link `app/davet/[code].tsx` "Devam et" artık store yazıp `/auth/phone`'a bypass. i18n `common.role.*`+`landing.*`+`errors.invitation_invalid`. Eski TASK-1.05 `__tests__/landing-screen.test.tsx` silinip test co-location ile `app/index.test.tsx`'e taşındı (kullanıcı onaylı). mobile 50 PASS, typecheck/lint/format temiz. Sıradaki lineer TASK-1.27 (telefon girişi).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 27/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.27 telefon girişi
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

**Task:** Yok — TASK-1.26 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.27 (telefon girişi) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.27` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 27 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.25 | M1 Auth backend (deep link) | ✅ Tamamlandı |
| 1.26 | Açılış ekranı (rol seçimi + manuel davet kodu + deep link dispatcher) | ✅ Tamamlandı |
| 1.27 | M1 Mobile UI (telefon girişi) | ⬜ Bekliyor |
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

### TASK-1.26 — Açılış ekranı (rol seçimi + manuel davet kodu + deep link dispatcher) (2026-05-30) ✅

- **Onboarding store (`mobile/src/onboarding/store.ts` YENİ)** — zustand 5 (kullanıcı onaylı). `flow: 'pt'|'member'|'member_via_invite'|undefined` + `invitationCode` + `phone`; `selectRole` (kodu temizler) / `selectInvite` (flow=member_via_invite) / `setPhone` / `reset`. `exactOptionalPropertyTypes` açık → alanlar `| undefined` union (opsiyonel değil).
- **Açılış ekranı (`mobile/app/index.tsx` GÜNCELLE)** — TASK-1.05 placeholder override. Logo + tagline + üç buton ("Üyeyim"/"Antrenörüm"/"Davetim var"). Rol → `selectRole`+`/auth/phone`. "Davetim var" inline kod input (`trUpper` TR-güvenli, ASCII alfanümerik, 6 char, `ABC-123` mask) + "Devam" → `fetchInvitationPreview`; valid → `selectInvite`+navigate, değilse `errors:invitation_invalid` inline. Deep link `app/davet/[code].tsx` "Devam et" de store yazıp `/auth/phone`'a bypass eder. i18n `common.role.*`+`landing.*`+`errors.invitation_invalid` (eski `landing.greeting/todayPrefix` silindi).
- Test ✅ — mobile **50 PASS** (`app/index.test.tsx` 9 + `store.test.ts` 7; davet test navigate/store assertion güncellendi). Eski `__tests__/landing-screen.test.tsx` (TASK-1.05) silinip co-location ile `app/index.test.tsx`'e taşındı (kullanıcı onaylı). typecheck/lint/format temiz.

### TASK-1.25 — Deep link kurulumu (Universal/App Link + .well-known/) (2026-05-30) ✅

- **Backend (`routes/well-known.ts` + `routes/davet-web-fallback.ts` YENİ)** — `GET /.well-known/apple-app-site-association` (uzantısız, `application/json`, `appID`+`paths:["/davet/*"]`) + `GET /.well-known/assetlinks.json` (`package_name`+SHA256 fingerprint); `GET /davet/:code` masaüstü fallback HTML + **sunucu-taraflı inline QR** (`qrcode` paketi — kullanıcı onaylı, harici servis yok). Env `APPLE_APP_ID`+`ANDROID_SHA256_CERT_FINGERPRINTS` placeholder (Yakın 5'te gerçek + redeploy). bunker-nginx tüm path'leri proxy'lediği için nginx'e dokunulmadı (Coolify yok — TASK-1.10 sapması).
- **Mobile** — `app.config.ts` deep link (`DEEP_LINK_DOMAINS = alpfit-staging.kiwiailab.com + alpfit.app` → iOS associatedDomains + Android autoVerify intentFilters); `app/davet/[code].tsx` (YENİ) preview ekranı (valid/notFound/expired/cancelled/used/network+retry); `src/api/invitations.ts` + `davet` i18n namespace; `public/.well-known/*` statik kopyalar (EAS Hosting Yakın 5).
- Test ✅ — backend **152 PASS** (well-known 2 + web-fallback 2) + mobile **36 PASS** (davet 6). typecheck/lint/format temiz. Elle cihaz testi rehberi `_dev/docs/deep-link-test.md`.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.26 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.27` (telefon girişi)
