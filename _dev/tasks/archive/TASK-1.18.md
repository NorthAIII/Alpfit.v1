# TASK-1.18: OTP send endpoint (rate limit + Redis)

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.17

---

## Hedef

`POST /auth/otp/send` endpoint'i kur — telefon numarası alır, 6 haneli random kod üretir, Redis'e TTL 5dk ile yazar, MockSmsProvider üzerinden gönderir. **Rate limit:** aynı telefon için 1 dakika içinde max 1 send (yeniden gönder kullanıcı tarafında 1dk sonra aktif olur; backend aynı kuralı zorlar). Brute force koruması TASK-1.19 verify'de; bu task **send**'e odaklı.

---

## Bağlam

F1.1 PRD: "6 haneli OTP kod SMS gönderilir, Kod 5 dakika geçerli, 1 dakika sonra 'Yeniden gönder' aktif". Discuss-phase: SMS provider mock, kod sabit veya log'a yazılır. Redis'i bu task'ta tanıtıyoruz — OTP storage hem TTL otomatik hem in-memory hız; kalıcı tarihsel kayıt `dev_otp_log` (TASK-1.17) ve audit log (TASK-1.14) tarafında.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 OTP akışı + rate limit
- `_dev/phases/PHASE-1.md` — Araştırma → Kullanılacak Araçlar (Redis 7)
- `_dev/QUALITY.md` §2 (SMS OTP brute force)
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — OTP Redis TTL + rate limit politikası

---

## Alt Görevler

- [ ] **1. Redis client kurulumu**
  - `pnpm -F @alpfit/backend add ioredis`
  - `backend/src/redis/client.ts` — `REDIS_URL`'den `ioredis` instance, singleton
  - `/healthz` extend — Redis PING kontrolü (failure ise `redis: 'down'`)
  - Dosya: `backend/src/redis/client.ts`, `backend/src/routes/healthz.ts` (UPDATE)

- [ ] **2. OTP generator + key sözleşme**
  - `backend/src/auth/otp.ts`:
    - `generateOtp(): string` — `crypto.randomInt(100_000, 999_999).toString()`
    - Redis key: `otp:send:<phoneE164>` → value `{ code, attempts: 0 }`, TTL 300sn
    - Rate limit key: `otp:rate:<phoneE164>` → SET NX EX 60 (1 dakika rate limit)
  - Dosya: `backend/src/auth/otp.ts`

- [ ] **3. POST /auth/otp/send route**
  - Body: `{ phone: string }` (zod schema; libphonenumber-js ile `shared/parseTrPhone` doğrular)
  - Phone E.164'e çevrilir
  - Rate limit kontrolü: `SET NX otp:rate:<phone> '1' EX 60` — set başarısız (zaten varsa) → 429 "Bir dakikada bir kod isteyebilirsiniz" + `Retry-After: 60`
  - OTP üretilir, Redis'e yazılır (`otp:send:<phone>` TTL 300)
  - `MockSmsProvider.sendOtp(phone, code, 300)` çağrılır
  - AuditLog `otp_sent` event (enum TASK-1.14'te tanımlı, hazır kullanılır)
  - Response: `{ success: true, expiresInSec: 300 }`
  - Dosya: `backend/src/routes/auth-otp-send.ts`

- [ ] **4. Integration testler**
  - `backend/src/routes/auth-otp-send.test.ts`:
    - Geçerli TR telefon → 200, Redis'te `otp:send:...` var, dev_otp_log row'u var
    - Geçersiz telefon (+1) → 400 zod hata
    - Aynı telefon ardışık 2 send → 2.si 429
    - 60 saniye sonra (zaman ilerletilir, Redis mock veya gerçek + sleep) yeniden send başarılı
  - Test rate limit için `vi.useFakeTimers()` + ioredis-mock veya Testcontainers Redis
  - Dosya: `backend/src/routes/auth-otp-send.test.ts`

- [ ] **5. Test setup: Redis container**
  - `backend/test/db-container.ts` extend — `startTestRedis()` Testcontainers Redis 7
  - Test setup'ta her suite kendi Redis'ini alır
  - Dosya: `backend/test/db-container.ts` (UPDATE), `backend/test/setup.ts` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── package.json                                            # GÜNCELLE
├── test/
│   ├── db-container.ts                                     # GÜNCELLE (Redis)
│   └── setup.ts                                            # GÜNCELLE
└── src/
    ├── redis/
    │   └── client.ts                                       # YENİ
    ├── auth/
    │   └── otp.ts                                          # YENİ
    └── routes/
        ├── auth-otp-send.ts                                # YENİ
        ├── auth-otp-send.test.ts                           # YENİ
        └── healthz.ts                                      # GÜNCELLE
```

---

## Dikkat Noktaları

- **Crypto secure random:** `crypto.randomInt` (Node built-in) — Math.random KULLANILMAZ.
- **Telefon validasyonu shared/phone.ts üzerinden** — TR-only kabul, hata anlamlı.
- **Rate limit IP bazlı değil telefon bazlı:** Aynı IP'den farklı telefonlar için rate limit yok (v1; gerekirse Yakın 5 öncesi IP rate limit eklenir).
- **PII:** Log'a telefon yazma; pino redact (TASK-1.11) telefonu `[REDACTED]` yapar.
- **Send sayısı toplam günlük limit:** v1'de yok; spam abuse Yakın 5 öncesi düşünülür.
- **Hata mesajı bilgi sızdırmaz:** "Bu telefon zaten kayıtlı" send aşamasında YOK — verify aşamasında üye var/yok ayrımı yapılır (F1.1 PRD'de "Bu telefon zaten kayıtlı, giriş yap" yönlendirmesi).

---

## Test Kriterleri

- [ ] `auth-otp-send.test.ts` 4 senaryo PASS
- [ ] Healthz Redis down durumunda 503 + `redis: 'down'`
- [ ] Concurrent 100 send tek telefon için sadece 1 başarılı (rate limit garanti)
- [ ] PII redact: log JSON'unda phone `[REDACTED]`
- [ ] dev_otp_log + redis OTP key tutarlı

---

## Karar Noktaları

- **`Retry-After` header:** Standart HTTP convention; mobile UI bu header'a göre 60s countdown gösterir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.18): add otp send endpoint with redis rate limit`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — OTP Redis TTL + rate limit politikası

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Redis katmanı (`backend/src/redis/client.ts` YENİ)** — `createRedisClient(url, opts?)` (her çağrı yeni instance) + `getRedis(url)` (production singleton) + `pingRedis(redis)`; `db/prisma.ts` deseninin birebir Redis karşılığı. `ioredis` eklendi.
- **`server.ts`** — `opts.redis ?? getRedis(env.REDIS_URL)` çözer, `app.redis` decorate, `redis.on('error', …)` pino log (EventEmitter throw koruması). `authOtpSendRoutes` register.
- **`/healthz` extend** — db **ve** redis PING (`Promise.all`); ikisinden biri down → `degraded` + 503; payload'a `redis: 'up'|'down'` alanı.
- **OTP sözleşmesi (`backend/src/auth/otp.ts` YENİ)** — `generateOtp()` `crypto.randomInt(100_000, 1_000_000)` (off-by-one düzeltildi), `otpSendKey`/`otpRateKey`, `OtpRecord {code, attempts}`, `tryAcquireSendSlot` (`SET NX EX 60` atomik), `storeOtp` (`SET EX 300`). Sabitler `OTP_TTL_SEC=300`, `OTP_RATE_LIMIT_SEC=60`.
- **`POST /auth/otp/send` (`backend/src/routes/auth-otp-send.ts` YENİ)** — doğrula (`parseTrPhone`) → rate slot (atomik) → OTP üret → Redis'e yaz → `createSmsProvider` (MockSmsProvider) `sendOtp` → `otp_sent` audit (telefon subject hash, `metadata.ip`). 400 invalid_phone / 429 rate_limited + `Retry-After: 60` / 200 `{success, expiresInSec}`. Kullanıcı-yönelik mesajlar i18n (`errors.json` `auth.otpRateLimited` eklendi).
- **Test izolasyonu (`backend/test/redis.ts` YENİ + `build-test-server.ts`)** — `createTestRedis()` gerçek Redis 7 + per-suite `keyPrefix` (Testcontainers değil — DECISIONS Karar 5). `buildTestServer` redis enjekte eder + `closeRedis` döner. `healthz.test.ts` + `internal-dev-otp.test.ts` yeni server imzasına uyarlandı.

**Test Sonucu:** backend **70 PASS** (önceki 63 + 6 auth-otp-send + 1 healthz redis-down). `auth-otp-send.test.ts` 6 senaryo: 200 Redis/dev_otp_log/audit tutarlılık, 400 yabancı numara, 400 boş body, 429 ikinci send + Retry-After, 60sn-sonrası (kilit silinerek) 200, concurrent-100 → tek 200. PII redaction MockSmsProvider'a delege edildiğinden `mock-sms-provider.test.ts` (TASK-1.17) kapsamını miras alır. typecheck + lint + format temiz. shared 41 + mobile 30 regresyon yeşil.

**Karar Noktası (DECISIONS "TASK-1.18"):** Test izolasyonu için Testcontainers yerine gerçek Redis + keyPrefix (Postgres izolasyon kararının devamı, ortam Docker daemon'ı desteklemiyor). Gerçek Redis TTL fake-timer ile ilerletilemediğinden "1dk sonra" senaryosu rate kilidi `del()` ile simüle edildi.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-30
