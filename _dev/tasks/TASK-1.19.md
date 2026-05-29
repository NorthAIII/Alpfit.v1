# TASK-1.19: OTP verify endpoint + brute force (5 hatalı = 15dk kilit)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.18

---

## Hedef

`POST /auth/otp/verify` endpoint'i kur — telefon + kod alır, Redis'teki OTP'yi karşılaştırır, doğruysa kullanıcı var mı kontrol eder (yoksa yeni user oluşturma akışına yönlendirir — JWT issue TASK-1.20'de), yanlışsa attempts++; 5 hatalı denemede telefon 15 dakika için kilitlenir. F1.1 PRD'deki "5 hatalı OTP → 15 dakika kilit (brute force)" kuralının uygulamasıdır.

---

## Bağlam

F1.1 PRD: "5 hatalı kod girişinden sonra 15 dakika kilit", "Çok fazla yanlış deneme, [süre] sonra tekrar dene". QUALITY.md §2: brute force koruması. Bu task verify ediyor + lockout uyguluyor + audit log yazıyor; user creation/login + JWT issue TASK-1.20'de.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 brute force koruması + edge case
- `_dev/QUALITY.md` §2 (SMS OTP brute force)
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → SMS OTP

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — OTP verify lockout politikası

---

## Alt Görevler

- [ ] **1. Redis lockout key sözleşmesi**
  - `otp:lockout:<phoneE164>` → TTL 900sn (15dk), 5 hatalı denemede SET
  - `otp:attempts:<phoneE164>` → INCR, TTL 300sn (OTP süresiyle aynı)
  - Dosya: `backend/src/auth/otp.ts` (UPDATE — lockout helper'lar)

- [ ] **2. POST /auth/otp/verify route**
  - Body: `{ phone: string, code: string }` (zod)
  - Lockout kontrolü: `EXISTS otp:lockout:<phone>` → 423 Locked, `Retry-After: <ttl>`, AuditLog `otp_verify_failed` (metadata: `reason: 'locked'`)
  - Redis'ten `otp:send:<phone>` GET → yoksa veya code mismatch → INCR attempts, AuditLog `otp_verify_failed`, attempts >= 5 → SET lockout 900s, response 401 "Hatalı kod" (5. denemede 423 lockout)
  - Eşleşirse: OTP key DEL + attempts key DEL + AuditLog `otp_verified` + response: `{ verified: true, userExists: boolean, isNew: boolean }` (user lookup `phoneE164` ile)
  - **Bu task JWT döndürmüyor** — TASK-1.20'de JWT issue + user create/login akışı
  - Dosya: `backend/src/routes/auth-otp-verify.ts`

- [ ] **3. dev_otp_log consumedAt update**
  - Doğru verify olduğunda `dev_otp_log` row'unda `consumedAt = now` set edilir (tarihsel kayıt için; production'da boş tablo)
  - Dosya: `backend/src/routes/auth-otp-verify.ts` (UPDATE)

- [ ] **4. Edge case'ler**
  - OTP süresi dolmuş (Redis key expire) → 410 Gone "Kodun süresi doldu, yeniden gönder"
  - Telefon hatalı format → 400 zod
  - Eşzamanlı 2 verify aynı koda (race) → birinci verify code'u tüketir, ikinci 410
  - Dosya: `backend/src/routes/auth-otp-verify.ts` (UPDATE)

- [ ] **5. Integration testler**
  - `backend/src/routes/auth-otp-verify.test.ts`:
    - Doğru kod → 200, OTP key silindi, AuditLog `otp_verified` yazıldı, dev_otp_log consumedAt set
    - Yanlış kod 1 deneme → 401, attempts=1
    - 5 hatalı deneme → 5.si 423 lockout, AuditLog `otp_verify_failed` 5 kayıt
    - Lockout aktifken doğru kod → 423 (kilit önce devreye girer)
    - 15 dakika sonra (fake timer) lockout düşer, yeni send + verify çalışır
    - Süresi dolmuş OTP → 410
    - Eşzamanlı 2 verify → biri 200 biri 410
  - Dosya: `backend/src/routes/auth-otp-verify.test.ts`

- [ ] **6. PII_FIELDS gözden geçir**
  - `code` zaten eklendi (TASK-1.17); audit metadata'da phone YASAK (TASK-1.14 zod whitelist)
  - Lockout response'unda hata mesajı sadece TR string, payload'da telefon yok

---

## Etkilenen Dosyalar

```
backend/
└── src/
    ├── auth/
    │   └── otp.ts                                      # GÜNCELLE (lockout helpers)
    └── routes/
        ├── auth-otp-verify.ts                          # YENİ
        └── auth-otp-verify.test.ts                     # YENİ
```

---

## Dikkat Noktaları

- **Constant-time comparison:** Kod karşılaştırması `crypto.timingSafeEqual` — string compare timing attack riski az ama best practice.
- **Lockout sonrası rate limit etkisi:** Lockout 15dk; rate limit 1dk (send). Lockout aktifken send istense 423 mü 429 mu? → Lockout precedence (verify endpoint lockout kontrol; send endpoint TASK-1.18'de lockout kontrol opsiyonel — eklenebilir).
- **Token rotate:** Verify başarılıysa OTP key silinir; aynı kod tekrar verify denemesi 410.
- **Audit log floodu:** 5 hatalı + ardışık denemeler audit log'u şişirebilir; v1'de kabul edilebilir. v1.5'te aynı telefon için ardışık fail event'leri batch'lenebilir.

---

## Test Kriterleri

- [ ] 7 senaryo PASS
- [ ] Brute force testi: 1000 random kod gönder, hiçbiri rastgele doğru bulmaz (matematik garanti, ama test smoke)
- [ ] Lockout TTL doğru çalışır (Redis TTL, fake timer ile doğrulama)
- [ ] AuditLog metadata PII içermez

---

## Karar Noktaları

- **5 hatalı sayacı OTP başına mı, sürekli mi?** F1.1 PRD: "5 hatalı kod girişinden sonra 15 dakika kilit". → OTP başına sayar; yeni send geldiğinde attempts reset (Redis OTP key ile birlikte). **Karar noktası:** Lockout düştükten sonra attempts reset mi, ya da kümülatif sayar mı (örn. 1 saatte 5 hatalı = kilit)?  → OTP başına reset öneririm (basit + UX iyi); kümülatif Yakın 5 öncesi gözden geçirilir.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Brute force lockout aşılırsa (örn. attacker telefon değiştirerek deniyor) — IP rate limit yokluğu.
  - **Mitigation:** v1'de kabul edilebilir (mock SMS, gerçek launch Yakın 5). Yakın 5 öncesi IP rate limit eklenir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.19): add otp verify endpoint with brute force lockout`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — OTP verify lockout politikası

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
