# TASK-1.29: OTP girişi ekranı (timer + yeniden gönder + hata feedback)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.07, TASK-1.08, TASK-1.19, TASK-1.27

---

## Hedef

OTP girişi ekranını implement et — 6 haneli kod input (6 ayrı 1-char input veya tek input), 5 dakika countdown timer, 1 dakika sonra "Yeniden gönder" butonu aktif, 5 hatalı sonra 15dk kilit feedback. Verify başarılıysa: mevcut user → home'a, yeni user → KVKK rıza ekranına. Dev modda "Dev OTP otomatik gir" butonu (internal endpoint TASK-1.17).

---

## Bağlam

F1.1 PRD: "6 haneli OTP", "Kod 5 dakika geçerli, 1 dakika sonra 'Yeniden gönder' aktif", "5 hatalı kod girişinden sonra 15 dakika kilit". Discuss-phase mock SMS + dev'de internal endpoint OTP'yi okunabilir kılar (test akışı kolaylaştırma).

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 OTP UI
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → mock SMS
- TASK-1.19 — verify endpoint
- TASK-1.17 — dev OTP lookup endpoint

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. `/auth/otp` ekran route**
  - `mobile/app/auth/otp.tsx`
  - Header: "Telefonuna gelen 6 haneli kodu gir" + alt metin "(SMS gelmediyse 1 dakika sonra 'Yeniden gönder' butonu aktif olur)"
  - 6 ayrı tek-karakter input (auto-advance on digit; backspace previous'a döner)
  - Timer: countdown 5:00 → 0:00 (saniye bazında); biterse "Kodun süresi doldu, yeniden gönder" butonu
  - "Yeniden gönder" butonu: ilk 60 sn'de disabled + countdown gösterir; sonra aktif
  - Dev mod: "Dev OTP getir" butonu (görünür sadece `__DEV__` veya `EXPO_PUBLIC_DEV_OTP_LOOKUP=true`)
  - Dosya: `mobile/app/auth/otp.tsx`

- [ ] **2. OTP input component**
  - `mobile/src/auth/otp-input.tsx` — 6 box auto-advance, paste support (clipboard'tan 6 hane geliyorsa hepsini dağıt)
  - `onComplete(code)` callback (6 hane girilince)
  - Dosya: `mobile/src/auth/otp-input.tsx`

- [ ] **3. Verify çağrısı + akış yönlendirmesi**
  - `onComplete` → `POST /auth/otp/verify` (TASK-1.19)
  - Response:
    - `200 { verified: true, isNew: false }` → mevcut user, refresh token return ediliyor mu? **Hayır**, TASK-1.20 yapısında refresh **profile create**'te issue ediliyordu. Mevcut user için **yeni endpoint** veya verify response'unda da JWT issue → karar
    - **Akış kararı:** TASK-1.20 `auth-profile`'ı yeni user için; **mevcut user login** için ayrı endpoint gerekir mi yoksa verify response'unda JWT döndürür? → Verify response'unda mevcut user için JWT issue (basit, tek istek). Bu kararı TASK-1.19 ve TASK-1.20'de hizalanmış olmalı; verify-plan'da çıkarsa düzelt.
    - Yeni user → KVKK rıza ekranına (TASK-1.28) navigate
    - Mevcut user → refresh token storage'a (TASK-1.33) + home'a navigate
  - `401 wrong code` → input reset + "Hatalı kod" feedback
  - `423 lockout` → "15 dakika sonra tekrar dene" + countdown
  - `410 expired` → "Kod süresi doldu, yeniden gönder"
  - Dosya: `mobile/app/auth/otp.tsx` (UPDATE)

- [ ] **4. Yeniden gönder akışı**
  - `POST /auth/otp/send` çağrılır (TASK-1.18)
  - 429 ise: backend zaten 60sn rate limit; UI countdown ile sync
  - Başarı: timer reset 5:00
  - Dosya: `mobile/app/auth/otp.tsx` (UPDATE)

- [ ] **5. Dev OTP lookup**
  - `__DEV__` veya `EXPO_PUBLIC_DEV_OTP_LOOKUP=true` ile aktif
  - "Dev OTP getir" tap → `GET /internal/dev-otp/:phone` (admin token header)
  - Otomatik 6 haneye dağıt
  - Dosya: `mobile/app/auth/otp.tsx` (UPDATE)

- [ ] **6. Component testleri**
  - `mobile/app/auth/otp.test.tsx`:
    - Doğru kod → verify mock 200 → KVKK ekranına navigate (yeni user)
    - Yanlış kod → 401 → input reset + hata mesajı
    - 5 hatalı → 423 → lockout mesajı
    - Süre doldu (timer 0) → expired UI
    - Yeniden gönder 60sn sonra aktif
    - Paste 6 hane clipboard → otomatik doldur
    - Dev OTP lookup mock → kod doldurur
  - Dosya: `mobile/app/auth/otp.test.tsx`

- [ ] **7. Accessibility + i18n**
  - 6 input'a label "Doğrulama kodu, hane 1/6"... (screen reader için)
  - i18n: `auth.otp.title`, `auth.otp.subtitle`, `auth.otp.resend_cta`, `errors.otp_invalid`, `errors.otp_locked`, `errors.otp_expired`

---

## Etkilenen Dosyalar

```
mobile/
├── .env.example                            # GÜNCELLE (EXPO_PUBLIC_DEV_OTP_LOOKUP)
├── app/auth/
│   ├── otp.tsx                             # YENİ
│   └── otp.test.tsx                        # YENİ
└── src/
    ├── auth/
    │   └── otp-input.tsx                   # YENİ
    └── i18n/locales/tr/
        ├── auth.json                       # GÜNCELLE
        └── errors.json                     # GÜNCELLE
```

---

## Dikkat Noktaları

- **Akış hizalanması:** Verify response'unda JWT döndürmek için TASK-1.19 + TASK-1.20 hizalanmış olmalı — verify-plan kontrol edilecek.
- **PII:** Telefon ekranda görünüyor (kullanıcı kendi telefon numarasını okur — bilinçli); log/Sentry'de scrub.
- **Paste UX:** iOS otomatik SMS code suggest (iOS 12+ `textContentType="oneTimeCode"`) — keyboard üzerinde önerir.
- **Backspace edge:** 6 input'ta backspace previous focus'a almalı.
- **Lockout state persist:** App kapatılıp açılırsa lockout devam eder (backend Redis tutar); UI lockout state'i backend'den her verify denemesinde 423 ile alır.

---

## Test Kriterleri

- [ ] 7 senaryo PASS
- [ ] iOS otomatik OTP suggest çalışır (`textContentType="oneTimeCode"`)
- [ ] Paste 6 hane otomatik dağılır
- [ ] Timer doğru sayar (zaman testi `vi.useFakeTimers`)
- [ ] Dev OTP lookup dev'de görünür, prod build'de gizli

---

## Karar Noktaları

- **6 ayrı input mı tek input mı:** F1.1 PRD spesifik değil; 6 ayrı modern UX (Apple/Google standardı). → 6 ayrı öneririm.
- **Verify response'unda JWT issue (mevcut user):** TASK-1.19'da bu yer almalı; verify-plan kontrol.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.29): add otp entry screen with timer and dev lookup`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
