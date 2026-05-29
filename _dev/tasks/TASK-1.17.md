# TASK-1.17: Mock SMS provider interface + dev_otp_log

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.13, TASK-1.14

---

## Hedef

SMS gönderme katmanını **provider interface + 2 driver** pattern'i ile soyutla — `SmsProvider` interface (TS), `MockSmsProvider` (dev/staging — `dev_otp_log` tablosuna yazar) ve `LiveSmsProvider` (Yakın 5'te gerçek provider). Bu task'ta sadece interface + Mock + dev_otp_log tablosu + lookup endpoint (sadece dev/staging). Live provider Yakın 5 öncesi tek dosya değişikliği ile eklenir ([[ilkeler]] §"Kalıcılık önceliği" — sonradan provider değiştirme migration ağrısı sıfır).

---

## Bağlam

Discuss-phase: "Sandbox/mock — geliştirme sürecinde mock SMS provider, kod sabit veya log'a yazılır. Gerçek SMS provider entegrasyonu Yakın 5 (UAT + Pilot) öncesi." Research-phase: "Provider interface + `MockSmsProvider` (dev_otp_log tablosuna yazar) + `LiveSmsProvider` (Yakın 5)." Bu task araştırmadaki **Mock SMS Mimari** kararının uygulamasıdır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 SMS OTP akışı
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → SMS OTP + Araştırma → Mock SMS Mimari
- `_dev/ILKELER.md` §"Kalıcılık önceliği" + §"Sır ve konfigürasyon yönetimi"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — SMS Provider interface + driver pattern + dev_otp_log politikası

---

## Alt Görevler

- [ ] **1. SmsProvider interface**
  - `backend/src/sms/sms-provider.ts`:
    ```ts
    export interface SmsProvider {
      sendOtp(phoneE164: string, code: string, ttlSec: number): Promise<{ providerMessageId?: string }>;
    }
    ```
  - Backend'deki tüm SMS çağrıları sadece bu interface üzerinden — Live driver sonradan inject edilir
  - Dosya: `backend/src/sms/sms-provider.ts`

- [ ] **2. dev_otp_log tablo**
  - ```prisma
    model DevOtpLog {
      id          String   @id @default(cuid())
      phoneE164   String
      code        String   // dev için açık (production'da bu tablo BOŞ)
      ttlSec      Int
      createdAt   DateTime @default(now())
      consumedAt  DateTime?

      @@index([phoneE164])
      @@index([createdAt])
    }
    ```
  - Migration: `pnpm prisma migrate dev --name dev_otp_log`
  - Dosya: `backend/prisma/schema.prisma` (UPDATE), `backend/prisma/migrations/<ts>_dev_otp_log/migration.sql`

- [ ] **3. MockSmsProvider implementasyonu**
  - `backend/src/sms/mock-sms-provider.ts`:
    ```ts
    export class MockSmsProvider implements SmsProvider {
      async sendOtp(phone, code, ttlSec) {
        await prisma.devOtpLog.create({ data: { phoneE164: phone, code, ttlSec } });
        console.log(`[MOCK SMS] ${phone} → ${code} (TTL ${ttlSec}s)`);
        return { providerMessageId: 'mock-' + Date.now() };
      }
    }
    ```
  - Dosya: `backend/src/sms/mock-sms-provider.ts`

- [ ] **4. SmsProvider factory**
  - `backend/src/sms/index.ts` — env'e göre Mock veya Live döner
  - `if (env.SMS_PROVIDER === 'mock') return new MockSmsProvider();`
  - `else throw new Error('Live SMS provider not implemented yet')` (Yakın 5'te dolar)
  - `.env.example`'a `SMS_PROVIDER=mock` (varsayılan)
  - Dosya: `backend/src/sms/index.ts`, `backend/.env.example` (UPDATE)

- [ ] **5. Dev OTP lookup endpoint (sadece dev/staging)**
  - `GET /internal/dev-otp/:phoneE164` → Son OTP kodunu döner; sadece `NODE_ENV != production` veya `APP_ENV != production`
  - Bu endpoint mobile dev cihazlarının OTP'yi otomatik almak için kullanılabilir (UI'da "Dev OTP girişi" toggle); production'da KAPALI
  - Admin token guard (TASK-1.15 `ADMIN_INTERNAL_TOKEN` ile aynı)
  - Dosya: `backend/src/routes/internal-dev-otp.ts`

- [ ] **6. Unit + integration testler**
  - `backend/src/sms/mock-sms-provider.test.ts`:
    - `sendOtp` çağrıldığında `dev_otp_log` row'u oluşur
    - Log çıktısında PII (telefon) **redact edilmiş** mi (pino redact TASK-1.11) — bu test pii-scrubber yazılı doğru çalıştığını teyit eder
  - `backend/src/routes/internal-dev-otp.test.ts`:
    - `NODE_ENV=test` (=production değil) → endpoint çalışır
    - `NODE_ENV=production` simulation → endpoint 404
    - Admin token olmadan 401
  - Dosya: `backend/src/sms/mock-sms-provider.test.ts`, `backend/src/routes/internal-dev-otp.test.ts`

- [ ] **7. PII_FIELDS güncelle**
  - `dev_otp_log.code` plaintext OTP içerir; pii-scrubber'da `code` veya `otpCode` alanı eklenir (Sentry/log sızıntısı önleme)
  - Dosya: `shared/src/pii-fields.ts` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── prisma/
│   ├── schema.prisma                                       # GÜNCELLE
│   └── migrations/<ts>_dev_otp_log/migration.sql           # YENİ
├── .env.example                                            # GÜNCELLE (SMS_PROVIDER)
└── src/
    ├── sms/
    │   ├── sms-provider.ts                                 # YENİ
    │   ├── mock-sms-provider.ts                            # YENİ
    │   ├── mock-sms-provider.test.ts                       # YENİ
    │   └── index.ts                                        # YENİ (factory)
    └── routes/
        ├── internal-dev-otp.ts                             # YENİ
        └── internal-dev-otp.test.ts                        # YENİ
shared/src/
└── pii-fields.ts                                           # GÜNCELLE
```

---

## Dikkat Noktaları

- **dev_otp_log production'da boş kalır:** Live driver kullanıldığında `MockSmsProvider` çağrılmaz, tablo doluuyor. Schema tutulur, sade tut.
- **Internal endpoint production'da 404:** Disabled olarak bırakılır; aktif olmasın diye `if (NODE_ENV === 'production') return reply.code(404)`.
- **Mobile dev OTP entry:** TASK-1.30'da mobile OTP ekranında dev modda "OTP otomatik gir" butonu eklenebilir (lookup endpoint çağırır); production build'de bu UI kapalı.
- **TTL semantic:** `ttlSec=300` (5 dakika) — discuss-phase kararı. OTP verify task'ı (TASK-1.19) bu TTL'i kullanır.

---

## Test Kriterleri

- [ ] Migration başarılı uygular
- [ ] `mock-sms-provider.test.ts` 2 senaryo PASS (insert + PII redact)
- [ ] `internal-dev-otp.test.ts` 3 senaryo PASS (dev erişim, production 404, auth)
- [ ] Pino log'unda telefon `[REDACTED]`
- [ ] Console.log mock SMS çıktısı dev'de görünür (production'da disabled veya redact)
- [ ] Sms factory `SMS_PROVIDER=mock` ile çalışır, başka değerle error

---

## Karar Noktaları

- **Console.log mock çıktısı:** Telefon dahil log dev'de okuyor; bu acceptable mı (sadece dev)? → Evet, dev kabul; ama pino üzerinden redact'lı (Sentry'ye sızmasın diye).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.17): add mock sms provider interface with dev otp log`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — SMS provider interface + dev_otp_log politikası

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
