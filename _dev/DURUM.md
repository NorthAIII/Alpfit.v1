# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.30 ✅: Profil oluşturma ekranı (`app/auth/profile.tsx` YENİ) — onboarding son adımı; ortak ad+soyad (zod 2-50 char + `\p{L}` TR-izinli, blur'da inline hata), PT akışında ek opsiyonel spor salonu+sertifika notu, avatar UI-only (picker import YOK). Submit→`createProfile` (kayıt jetonu Bearer); `member_via_invite`→`acceptInvitation` ardışık (network 3 deneme, terminal hatada uyarı+manuel home), diğer→`/home` placeholder replace; 409→"Giriş yap"→phone. `src/auth/profile-schema.ts` (YENİ), `src/api/auth.ts` (createProfile/acceptInvitation/ProfileUser GÜNCELLE), `app/home/index.tsx` (YENİ placeholder), i18n auth.profile.*/common.home.*. mobile 71 PASS, typecheck/lint/format temiz. Lineer sıradaki TASK-1.31 (PT "Üyeler" sekmesi).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 30/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.31 PT "Üyeler" sekmesi
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

**Task:** Yok — TASK-1.30 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.31 (PT "Üyeler" sekmesi) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.31` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 30 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.27 | M1 Mobile UI (telefon girişi) | ✅ Tamamlandı |
| 1.28 | KVKK rıza ekranı (2 tickbox + placeholder metin) | ✅ Tamamlandı (sıra dışı) |
| 1.29 | OTP girişi ekranı (timer + yeniden gönder + dev lookup) | ✅ Tamamlandı |
| 1.30 | Profil oluşturma ekranı (üye + PT) | ✅ Tamamlandı |
| 1.31–1.34 | M1 Mobile UI + akış + smoke (PT üyeler tab, banner, auto-login, e2e smoke) | ⬜ Bekliyor (4) |

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

### TASK-1.30 — Profil oluşturma ekranı (üye + PT) (2026-05-30) ✅

- **Ekran (`mobile/app/auth/profile.tsx` YENİ)** — Onboarding son adımı. Ortak ad+soyad (zorunlu); PT akışında (`flow === 'pt'`) ek opsiyonel spor salonu + sertifika notu; avatar UI-only (image picker import YOK, "yakında" hint). KVKK rızaları KVKK ekranından `useLocalSearchParams` ile gelir. Submit → `createProfile` (kayıt jetonu Bearer); 201'de `member_via_invite` → `acceptInvitation` ardışık (network 3 deneme; terminal hatada uyarı + manuel "Devam et" → home, profil zaten oluştu); diğer akışlarda doğrudan `/home` placeholder `replace`. 409 → "Bu telefon zaten kayıtlı" + "Giriş yap" → `/auth/phone`.
- **Şema + API + home** — `mobile/src/auth/profile-schema.ts` (YENİ: zod `nameField` 2-50 char + `^[\p{L}\s]+$/u` TR-izinli; `validateName` blur inline feedback). `mobile/src/api/auth.ts` (GÜNCELLE): `createProfile` (201/409/403/401/400/network; opsiyonel PT alanları boşsa atlanır) + `acceptInvitation` (connected/failed/network) + `ProfileUser`. `mobile/app/home/index.tsx` (YENİ: "Hoş geldin, [isim]" placeholder, gerçek içerik TASK-1.31/1.33). i18n `auth.profile.*` + `common.home.*`.
- Test ✅ — mobile **71 PASS** (`app/auth/profile.test.tsx` 7: üye→home, PT alanları görünür+boş submit, üyede gizli, geçersiz isim→inline+CTA disabled, 409→phone replace, invite create+accept ardışık, accept fail→uyarı). typecheck/lint/format temiz; lint ham `.toUpperCase()` yakaladı → avatar initial `trUpper` ([[tr-locale-util-zorunlu]]). Backend kontratı (kayıt jetonu Bearer) task taslağındaki body'den farklıydı → gerçek kontrat izlendi.

### TASK-1.29 — OTP girişi ekranı (timer + yeniden gönder + dev lookup) (2026-05-30) ✅

- **Ekran (`mobile/app/auth/otp.tsx` YENİ)** — 6 kutu + 3 sayaç tek `setInterval` ile döner: kod geçerlilik 5:00→0:00, "yeniden gönder" kilidi 60sn, brute-force kilidi (423 → 15:00 countdown). `onComplete` (6 hane) → `verifyOtp`. Akış: `registered` → `setRegistrationToken` + `/auth/kvkk` push; `logged_in` → `router.replace('/')` (token persist + ana ekran TASK-1.33 kapsamı, burada YOK). Hata: `invalid_code`→input reset+mesaj, `expired`→süre doldu, `locked`→countdown+input disabled, `network`→mesaj.
- **OTP input + API + store** — `mobile/src/auth/otp-input.tsx` (YENİ: kontrollü 6 kutu, tek-hane auto-advance, boş-kutu backspace→önceki sil+odakla, paste/iOS `oneTimeCode` dağıtım). `mobile/src/api/auth.ts` (GÜNCELLE): `verifyOtp` ayrık sonuç (200 `isNew`→logged_in/registered; 401/410/423→invalid/expired/locked), `fetchDevOtp` (dev GET `/internal/dev-otp/:phone` admin bearer; hata→sessiz), `isDevOtpLookupEnabled`. Store `registrationToken`+`setRegistrationToken` (yeni-üye onboarding artifact'ı, kalıcı oturum DEĞİL). dev OTP env (`EXPO_PUBLIC_DEV_OTP_LOOKUP`/`_TOKEN`) + i18n `auth.otp.*`/`errors.otp.*` düzenlendi.
- Test ✅ — mobile **64 PASS** (`app/auth/otp.test.tsx` 9: yeni→kvkk+token, mevcut→replace, yanlış→reset, 423→kilit+disabled, timer 0→expired, resend 60sn→send, tek-tek 6 hane, paste, dev lookup). Backend verify hizalaması zaten yerinde. typecheck/lint/format temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.30 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.31` (PT "Üyeler" sekmesi)
