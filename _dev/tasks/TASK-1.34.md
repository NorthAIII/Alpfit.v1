# TASK-1.34: Uçtan uca smoke testi (Mock SMS → OTP → profil → PT bağlanma)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.26..1.33 (tüm UI + akış)

---

## Hedef

M0 + M1'in uçtan uca davranışını component-level smoke test'le doğrula: backend bütünsel testi + mobile flow testi. PT açılır → davet kodu üretir → mock SMS dev_otp_log üzerinden bir üye OTP akışıyla açılır → davet kabul eder → PT banner görür + üyeler listesinde görünür. **E2E (Maestro) Yakın 5'te**; bu task **integration-level** kapsam (backend bütünsel + mobile mock'lu).

---

## Bağlam

Discuss-phase: "Test stratejisi: Backend unit + integration. Mobile component + smoke test (3-5 kritik akış: SMS OTP girme, davet linki açma). E2E Yakın 5'te." Bu task fazın **milestone doğrulayıcısı** — kabul kriterleri "PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır" hep birlikte çalışır mı.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 tam akış
- `_dev/phases/PHASE-1.md` — Milestone listesi
- TASK-1.04, TASK-1.08 — test altyapısı
- TASK-1.17..1.32 — backend + UI implementasyonu

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. Backend integration smoke (Testcontainers)**
  - `backend/test/smoke/onboarding-flow.test.ts`:
    - Test setup: clean DB + Redis (Testcontainers)
    - Senaryo A: PT akışı uçtan uca
      1. `POST /auth/otp/send` PT telefon
      2. `dev_otp_log` query ile kod al
      3. `POST /auth/otp/verify` + `POST /auth/profile` (role: trainer)
      4. `POST /invitations` davet üret
      5. AuditLog'da event'ler doğru: otp_sent, otp_verified, user_created, consent_granted, invitation_created
    - Senaryo B: Üye akışı + davet kabul
      1. `GET /invitations/:code` (preview) PT bilgisi alır
      2. `POST /auth/otp/send` üye telefon
      3. OTP verify + profile create (role: member)
      4. `POST /invitations/:code/accept`
      5. `GET /trainers/me/members` (PT token'ı ile) → üye listede
      6. `GET /trainers/me/events?since=...` → invitation_accepted event görünür
    - Senaryo C: Replay attack
      1. PT refresh token al
      2. Token rotate et (refresh çağır)
      3. Eski token'la refresh denemesi → 401 + family revoked
    - Senaryo D: Brute force lockout
      1. OTP send + 5 hatalı verify → 423 lockout
      2. Doğru kod ile verify → hala 423
  - Dosya: `backend/test/smoke/onboarding-flow.test.ts`

- [ ] **2. Mobile component smoke**
  - `mobile/test/smoke/onboarding-flow.test.tsx`:
    - MSW (mock service worker) ile backend mock'lanır
    - Senaryo: Landing → "Üyeyim" → Phone → OTP → KVKK → Profile → Home navigation chain
    - Senaryo: Deep link `/davet/ABC123` ile direkt akış → Phone → OTP → KVKK → Profile + Auto-accept invite → Home
    - Senaryo: PT açılışı → Members tab → "+ Üye davet et" → modal → kopyala
    - Senaryo: Auto-login (refresh token storage'da var) → boot → home (OTP atlanır)
  - Dosya: `mobile/test/smoke/onboarding-flow.test.tsx`

- [ ] **3. Coverage check**
  - Backend coverage: tüm auth route'ları + invitation route'ları kapsama
  - Mobile coverage: tüm auth ekranları + members tab
  - Threshold şu an YOK; review-phase'de karar verilir

- [ ] **4. Manuel smoke (staging)**
  - Staging deployment üzerinde manuel test:
    - PT (test cihaz 1) açılır → telefon → OTP (dev lookup) → KVKK → profil → davet üret → linki kopyala
    - Üye (test cihaz 2) linki açar → davet preview → onboarding → kabul → home
    - PT cihazında banner görünür + üye listede
    - Sentry dashboard'da PII yok event'ler var
    - Backblaze yedek (TASK-1.16) günlük çalıştığını doğrula
  - Dosya: `_dev/docs/staging-smoke-test.md` — manuel test checklist

- [ ] **5. Sentry event smoke**
  - Test event fırlat: `Sentry.captureMessage('staging smoke', { extra: { phone: '+90555TEST' }})`
  - Sentry dashboard'da event görünür, phone yok (`[REDACTED]`)

---

## Etkilenen Dosyalar

```
backend/test/smoke/
└── onboarding-flow.test.ts                            # YENİ
mobile/test/smoke/
└── onboarding-flow.test.tsx                           # YENİ
_dev/docs/
└── staging-smoke-test.md                              # YENİ (manuel checklist)
```

---

## Dikkat Noktaları

- **MSW (mobile mock):** TASK-1.08'de kurulu; bu task uçtan uca onboarding akışını mock'layacak handler'ları `mobile/test/msw/handlers.ts`'e ekler (paket kurulumu YOK).
- **Backend integration testi süresi:** Testcontainers Postgres + Redis 2 container = 15-30s boot. Smoke testi 1-2 dakika tolerable.
- **Staging smoke manuel adım:** Kullanıcının bizzat test cihazlarıyla yapması gerekiyor; rehber doküman yardımcı.
- **PHASE-1 milestone karşılaştırması:** Bu task'ın PASS olması faz milestone'unun karşılandığının göstergesi. Verify-phase'de (UAT) gerçek kullanıcı senaryosuyla tekrar doğrulanır.
- **Bu task LİNEER zincirin SON adımı**; başarısızsa hangi task'ın hatalı olduğu test çıktısında belirgin (test isimleri akış adımlarını yansıtır).

---

## Test Kriterleri

- [ ] Backend smoke 4 senaryo PASS (PT akışı, üye akışı, replay, brute force)
- [ ] Mobile smoke 4 senaryo PASS (üye onboarding, deep link, PT davet üret, auto-login)
- [ ] Manuel staging smoke checklist tamam — kullanıcı tarafından imzalı (`staging-smoke-test.md` checkbox'lar işaretli)
- [ ] Sentry dashboard'da hata YOK + test event'i PII'sız görünür
- [ ] Backblaze yedek mevcut
- [ ] CI'da bu task'ın testleri yeşil

---

## Karar Noktaları

- **MSW mi başka mock kütüphanesi mi:** MSW endüstri standardı; öneririm.
- **Manuel staging test kapsamı:** Bu fazın milestone'una sadık kalır; sonraki fazlarda extend edilir.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Smoke testte fail çıkan task araştırılıp düzeltilmeden faz kapanmamalı.
  - **Mitigation:** Bu task FAIL ise ilgili task'lar revize edilir; gerekirse verify-phase öncesi durdurulur.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`test(TASK-1.34): add end-to-end smoke tests for onboarding flow`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
