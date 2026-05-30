# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — verify-phase 1 kısmen tamamlandı. TASK-1.35 ✅ (timingSafeEqual). Kritik bulgu: CI son 5+ commit'te kırık (Redis eksik) → staging eski sürümde → TASK-1.36 açıldı. 10 manuel UAT TASK-1.36 sonrasına ertelendi.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** verify
**İlerleme:** 35/36 task tamam (TASK-1.36 bekliyor); otomatik UAT geçti; CI bulgusu (Redis eksik) nedeniyle 10 manuel UAT ertelendi
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

**Task:** TASK-1.36 — CI kırık: Redis servisi eksik + mobile typecheck shared build
**Durum:** ⬜ Bekliyor
**Sonraki Adım:** TASK-1.36 çalıştır (ci.yml'e Redis service + mobile shared build adımı). CI yeşillenince staging otomatik güncellenir. Sonra Expo Go kurulumu + verify-phase yeniden çalıştır.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 34 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.31 | PT "Üyeler" sekmesi UI (Bekleyen + Aktif + Linki kopyala + QR) | ✅ Tamamlandı |
| 1.32 | Davet kabul banner + liste real-time (in-app polling) | ✅ Tamamlandı |
| 1.33 | 30 gün cihaz hatırlama (secure storage + auto-login) | ✅ Tamamlandı |
| 1.34 | Uçtan uca smoke testi (Mock SMS → OTP → profil → bağlanma) | ✅ Tamamlandı |
| 1.35 | admin-internal timingSafeEqual düzeltmesi (security review bulgusu) | ✅ Tamamlandı |
| 1.36 | CI kırık: Redis eksik + mobile shared build (verify-phase bulgusu) | ⬜ Bekliyor |

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

### TASK-1.34 — Uçtan uca onboarding smoke testi (2026-05-30) ✅

- **Backend integration smoke** (`backend/test/smoke/onboarding-flow.test.ts` YENİ) — 4 senaryo gerçek HTTP zinciri (`app.inject`, kısa devre yok; OTP `dev_otp_log`'tan): **A** PT akışı (send→verify→profile→invitations + audit zinciri otp_sent/otp_verified/user_created/consent_granted/invitation_created), **B** üye+davet kabul (preview→onboarding→accept; PT members + events'te görünür), **C** replay (rotate→eski token→401 + aile iptal), **D** brute-force (5 hatalı→423; doğru kod hâlâ 423). **Tuzak:** her senaryo AYRI telefon — Redis send-slot 60sn TTL beforeEach'te temizlenmez.
- **Mobile component smoke** (`mobile/test/smoke/onboarding-flow.test.tsx` YENİ) — gerçek api/*+ekran+store, backend MSW mock (jest.mock api YOK). Ekranlar tek tek render + `mockRouter` + onboarding store ile zincir: 1) Landing→telefon→OTP→KVKK→profil→home, 2) deep-link davet→auto-accept→home, 3) PT davet üret→modal→kopyala, 4) auto-login `bootstrapSession`. **Tuzak:** Sentry modülü stub'landı (gerçek `@sentry/react-native` AsyncExpiringMap interval → jest worker leak).
- **MSW + manuel + sonuç** — `mobile/test/msw/handlers.ts` reusable builder'lar (default `handlers` boş kaldı, `server.use` ile composer); `_dev/docs/staging-smoke-test.md` (YENİ) manuel staging checklist (kullanıcı: 2 cihaz + Sentry PII + Backblaze teyidi). Backend **171 PASS** (+4), mobile **114 PASS** (+4); typecheck/lint/format temiz; **yeni kaynak kod YOK** (sadece test+doküman).

### TASK-1.33 — 30 gün cihaz hatırlama (secure storage + auto-login) (2026-05-30) ✅

- **Kalıcılık + client katmanı** — `expo-secure-store ~56.0.4` (app.config plugin). `src/auth/storage.ts` (YENİ): refresh token + rol Keychain/Keystore'da; **access token saklanmaz** (kısa ömürlü, her boot'ta refresh). `src/api/client.ts` (YENİ): `refreshAccessToken` **TEK-uçuş singleton** (eşzamanlı 401'ler tek refresh paylaşır → backend replay tetiklenmez), `authedFetch` (401→bir kez refresh+retry), `fetchMe`/`requestMe`. `src/auth/auth-actions.ts` (YENİ): `persistLogin` (rol biliniyorsa direkt, OTP login'de `/auth/me` ile çözer), `bootstrapSession` (refresh→/me→role), `homePathForRole`. `session.ts` `clearSession`; `api/auth.ts` logout/logout-all.
- **UI + bağlama** — login persisti **bağlandı**: otp.tsx (logged_in) + profile.tsx (created) artık session store'a YAZIYOR (önceden hiç yazılmıyordu — members tab token boştu). `_layout.tsx` boot gate (in-app "Yükleniyor" overlay; `expo-splash-screen` EKLENMEDİ). `(tabs)/settings.tsx` (YENİ) + Ayarlar sekmesi: çıkış + tüm cihazlardan çıkış, 2-adım satır-içi onay. i18n `settings` namespace.
- **Reuse + test** — `GET /auth/me` (TASK-1.20) yeniden kullanıldı (yeni backend yok); `auth-store.ts` yerine `session.ts` extend; client.ts interceptor kuruldu ama mevcut trainer/invitation çağrıları henüz authedFetch'e taşınmadı (sonraki faz). `test/mocks/expo-secure-store.ts` (bellek-içi). Mobile **110 PASS** (+21: storage 5 + client 7 + auth-actions 6 + settings 3); backend dokunulmadı (167); typecheck/lint/format temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** TASK-1.36 — CI Redis eksik + mobile shared build
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task` → TASK-1.36 → CI yeşil → staging güncellenir → `/devflow:verify-phase 1` yeniden çalıştır
