# TASK-1.27: Telefon girişi ekranı (+90 inline validation)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.06, TASK-1.18, TASK-1.26

---

## Hedef

Telefon girişi ekranını implement et — `+90 5XX XXX XX XX` formatında mask'lı input, inline validation (yazarken kırmızı/yeşil feedback), `shared/phone.ts` üzerinden TR doğrulama. "Devam" butonu → KVKK rıza ekranına geçiş (yeni kullanıcı için; mevcut user akışı verify sonrası 409 handle eder). Inline rate limit (429) ve sistem hatası mesajları TR.

---

## Bağlam

F1.1 PRD: "Telefon numarası TR formatında girilir (+90 5XX XXX XX XX), inline validation", "TR dışı telefon numarası: v1'de sadece +90 kabul edilir". Discuss-phase: Mock SMS ile çalışır; kullanıcının asıl gönderim tetiklemesi KVKK rıza sonrası (TASK-1.28) — bu task **telefon validate** ediyor, send TASK-1.29 OTP girişine geçişte yapılır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 telefon doğrulama
- `_dev/QUALITY.md` §7 (TR yerelleştirme)
- `_dev/phases/PHASE-1.md` — Kapsam Dışı (TR dışı telefon yasak)
- TASK-1.06 — `shared/phone.ts` util

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. `/auth/phone` ekran route**
  - `mobile/app/auth/phone.tsx`
  - Header: "Telefon numaranı gir" + alt metin "+90 ile başlayan TR mobil hat"
  - Input: mask'lı (`+90 5XX XXX XX XX`); maskedinputstayle: `react-native-mask-text` veya kendi mask helper (`shared/phone.ts` extend)
  - Inline feedback:
    - Yazarken `validateTrPhone()` çağrılır
    - 7+ haneden sonra valid değilse: input border kırmızı + "Sadece TR mobil hat (+90 5XX)" mesajı
    - 13 hane + valid: border yeşil
  - "Devam" butonu — sadece valid telefonda aktif
  - Dosya: `mobile/app/auth/phone.tsx`

- [ ] **2. Mask + parser**
  - `mobile/src/auth/phone-mask.ts` — `shared/phone.ts` + react-native specific input mask handler
  - Kullanıcı yazarken otomatik boşluk ekler: `5551234567` → `5 555 123 45 67`
  - Dosya: `mobile/src/auth/phone-mask.ts`

- [ ] **3. Devam butonu aksiyonu**
  - Telefon E.164'e parse edilir (`+905551234567`)
  - Onboarding store'a kaydedilir
  - **Akış kararı:** Mevcut user kontrolü için ne yapıyoruz?
    - Seçenek A: Backend `GET /auth/exists?phone=...` endpoint (yeni, eklenmeli)
    - Seçenek B: Telefon ekranında kontrol yapmadan KVKK rıza ekranına geç; OTP verify aşamasında mevcut user → 409 → login akışına yönlendir
    - **Önerim B** (sade, ek endpoint yok, KVKK ihlali riski sıfır — telefon var/yok sızdırmıyoruz). F1.1 PRD: "Bu telefon zaten kayıtlı, giriş yap" yönlendirmesi verify sonrası gelir.
  - Sonraki ekran: KVKK rıza (`/auth/kvkk`) — yeni kullanıcı akışı
  - Mevcut kullanıcı akışı: telefon → OTP → JWT direkt (KVKK rıza ekranı atlanır; user'ın `kvkkConsentAt` zaten var)
    - Bu durumu yönetmek için: telefon ekranından **KVKK ekranı atlayıp OTP'ye gitme**, OTP verify response'unda `userExists` kontrol et + KVKK ekranı sadece `userExists: false` ise göster
    - **Akış basitleşmesi:** Yeni vs mevcut user → OTP send/verify sonrasında ayrılır; bu ekran sadece telefon validate + OTP send tetikleme
  - **Akış yeniden düzenleme:** Bu ekranda OTP send çağrısı (`POST /auth/otp/send` — TASK-1.18) yapılır, sonra OTP ekranına geçilir. KVKK rıza ekranı OTP verify sonrasında, sadece yeni kullanıcılarda.
  - Dosya: `mobile/app/auth/phone.tsx` (UPDATE)

- [ ] **4. Hata durumları**
  - Rate limit 429 → "Bir dakika içinde tekrar dene" + 60s countdown
  - Network hatası → "Bağlantı sorunu, tekrar dene"
  - Geçersiz telefon (server-side, çok rare) → "Telefon formatı geçersiz"
  - Sentry log (PII scrubbing aktif)
  - Dosya: `mobile/app/auth/phone.tsx` (UPDATE)

- [ ] **5. Component testleri**
  - `mobile/app/auth/phone.test.tsx`:
    - Valid TR telefon → Devam aktif, tap edince OTP send mock çağrılır
    - Invalid telefon → Devam disabled, inline hata
    - 429 yanıtı → countdown ve mesaj
    - Network hatası → mesaj
  - Dosya: `mobile/app/auth/phone.test.tsx`

- [ ] **6. Accessibility + i18n**
  - i18n key'leri `auth.json`: `auth.phone.title`, `auth.phone.label`, `auth.phone.error.invalid`, `auth.phone.cta`, `errors.rate_limit`, `errors.network`
  - Input `accessibilityLabel`, `keyboardType="phone-pad"`, `autoComplete="tel"`

---

## Etkilenen Dosyalar

```
mobile/
├── app/auth/
│   ├── phone.tsx                           # YENİ
│   └── phone.test.tsx                      # YENİ
└── src/
    ├── auth/
    │   └── phone-mask.ts                   # YENİ
    └── i18n/locales/tr/
        ├── auth.json                       # GÜNCELLE
        └── errors.json                     # GÜNCELLE
```

---

## Dikkat Noktaları

- **Akış sade kalsın:** Telefon → KVKK ekranı atla → OTP send → OTP ekranı → verify (yeni kullanıcı için KVKK rıza ekranı verify sonrası). Bu akış değişikliği TASK-1.28 (KVKK ekranı) ve TASK-1.29 (OTP ekranı) bağımlılığını yeniden düzenler — bu task **akış kararını** netleştiriyor.
- **Aslında F1.1 PRD'de:** "SMS OTP sonrası, profil formundan önce KVKK aydınlatma + sağlık verisi açık rıza ekranı çıkar". → **KVKK ekranı OTP verify sonrası**, yeni kullanıcılarda. Bu akış doğru — telefon → OTP send → OTP gir → verify → (yeni ise) KVKK rıza → profil → login; (mevcut ise) verify → login direkt.
- **Akış güncellemesi:** Bu task'ta telefon ekranı OTP send'i tetikler; KVKK ekranı (TASK-1.28) ve profil ekranı (TASK-1.30) verify sonrası akışına bağlanır. TASK numara sırası doğru ama bağımlılıklar yeniden gözden geçirilmeli (verify-plan aşamasında).
- **TR mobil hat prefix:** 5XX kontrolü (libphonenumber-js TR ile yapar).

---

## Test Kriterleri

- [ ] 4 senaryo PASS
- [ ] Inline validation 50ms debounce ile takılma olmaz
- [ ] keyboard "phone-pad" açılır
- [ ] OTP send başarılı response → OTP ekranına geçer
- [ ] PII: log/Sentry'de telefon `[REDACTED]`

---

## Karar Noktaları

- **OTP send bu ekranda mı bir sonrakinde mi:** Bu ekran "Devam"a basınca send → OTP ekranına geç (kullanıcı zaten "Devam"la rıza vermiş demektir; SMS gelir). Alternatif OTP ekranında "Kod gönder" butonuyla tetiklemek — ekstra tıklama, sürtünme. → Bu ekran send tetikler, öneririm.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.27): add phone entry screen with tr inline validation`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
