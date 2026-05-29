# TASK-1.11: Backend Sentry + PII scrubber + KVKK test

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.02, TASK-1.04, TASK-1.10

---

## Hedef

Backend'e Sentry SDK kur (EU Frankfurt residency), `req.body` ve diğer payload alanlarında PII'ı (telefon, isim, kilo, boy, yemek, sağlık verisi) Sentry'ye gitmeden **scrub** et. pino logger'a `fast-redact` ekle. Bir KVKK test'i yaz: kilo/boy/yemek alanları içeren mock event Sentry transport'a verildiğinde **payload'da bu alanların bulunmadığını** assertion ile doğrula. Bu task Araştırma §Tuzak #3 (Sentry default PII gönderir) mitigation'ının kendisidir.

---

## Bağlam

Research-phase Sentry Developer (EU Frankfurt) seçti — KVKK residency free plan'da, PII scrubbing 3 katmanlı, RN+Node tek araç. KVKK Madde 6 sağlık verisi özel nitelikli — log'lara/Sentry'ye sızması ihlal. Discuss-phase: "log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash)". Bu task'ta hem Sentry hem pino aynı scrubbing matrisini paylaşır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §4 (KVKK Çerçevesi), §8 (Observability)
- `_dev/phases/PHASE-1.md` — Araştırma → Observability + Dikkat Edilecekler #3 (Sentry PII) + #7 (5K event quota)
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi"
- `_dev/QUALITY.md` §2 (Güvenlik & Gizlilik)
- `CLAUDE.md` → Projeye Özgü Kurallar → KVKK / Sağlık Verisi

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Sentry + fast-redact 3-katmanlı PII scrubbing matrisi kararı
- `_dev/memory/` — `kvkk-pii-scrubbing-matrisi.md` (proje genelinde geçerli kural)

---

## Alt Görevler

- [ ] **1. Sentry SDK + fast-redact kurulumu**
  - `pnpm -F @alpfit/backend add @sentry/node fast-redact`
  - `backend/src/observability/sentry.ts` — `Sentry.init({ dsn, environment, tracesSampleRate: 0.1, beforeSend: piiScrubber })`
  - Region EU: DSN otomatik EU Frankfurt (Sentry Cloud EU)
  - Dosya: `backend/src/observability/sentry.ts`

- [ ] **2. PII alan listesi (Single Source of Truth)**
  - `shared/src/pii-fields.ts` — `export const PII_FIELDS = ['phone', 'phoneNumber', 'name', 'firstName', 'lastName', 'weight', 'height', 'measurement', 'foodLog', 'meal', 'calories', 'note', 'kvkkConsent', ...]`
  - Tek dosyada tutulur; backend (pino + Sentry) + mobile (TASK-1.12 Sentry mobile) bu listeyi paylaşır
  - Dosya: `shared/src/pii-fields.ts`, `shared/src/index.ts` (UPDATE re-export)

- [ ] **3. pino fast-redact konfigürasyonu**
  - `backend/src/server.ts` — pino instance `redact: { paths: PII_FIELDS.flatMap(f => [\`*.${f}\`, \`*.*.${f}\`, ...]), censor: '[REDACTED]' }`
  - PII alanları log JSON'unda `[REDACTED]` ile değiştirilir
  - Dosya: `backend/src/server.ts` (UPDATE)

- [ ] **4. Sentry beforeSend PII scrubber**
  - `backend/src/observability/pii-scrubber.ts` — `beforeSend(event)` Sentry'ye gitmeden event objesi içinden PII_FIELDS'i recursive olarak siler
  - 3 katmanlı: (a) `event.request.data` (body), (b) `event.user` (Sentry user context), (c) `event.extra` + `event.contexts`
  - User ID **hash'lenir** (sha256(user_id) ilk 12 karakteri); ham user ID Sentry'ye gitmez
  - Dosya: `backend/src/observability/pii-scrubber.ts`

- [ ] **5. Sentry quota webhook**
  - Sentry projesi Settings → Quota → Webhook → Slack/email
  - `quota_exceeded` event'i Slack webhook'una bağlanır (Araştırma §Tuzak #7 mitigation)
  - **Manuel adım** — kullanıcı Sentry dashboard'unda yapar; rehber `_dev/docs/sentry-setup.md`
  - Dosya: `_dev/docs/sentry-setup.md`

- [ ] **6. KVKK PII test (KRİTİK kabul kriteri)**
  - `backend/src/observability/pii-scrubber.test.ts`:
    - **Test 1 (Sentry beforeSend):** Mock event içinde `{ user: { phone: '+90555...', weight: 75 }, extra: { mealLog: 'omlet' } }` → `beforeSend(event)` çıktısında bu alanlar yok (undefined veya `[REDACTED]`)
    - **Test 2 (pino redact):** logger.info({ phone, weight, mealLog, password }) → stdout capture'da bu alanlar `[REDACTED]`
    - **Test 3 (negative):** Hash'lenmiş user ID `event.user.id` formatta var ama ham `phone` yok
  - Dosya: `backend/src/observability/pii-scrubber.test.ts`

- [ ] **7. /healthz error logging smoke**
  - Sentry init başarısızsa app start ETKİLENMEZ (DSN env eksikse warning + Sentry disabled, app çalışmaya devam eder)
  - Dosya: `backend/src/observability/sentry.ts` (env yoksa no-op pattern)

- [ ] **8. Memory: PII scrubbing matrisi**
  - `_dev/memory/kvkk-pii-scrubbing-matrisi.md` — yeni alan eklerken (örn. v1.5'te yeni sağlık verisi tipi) bu listeye eklenmesi disiplini
  - MEMORY.md "Süreç Disiplinleri" altına pointer
  - Dosya: `_dev/memory/kvkk-pii-scrubbing-matrisi.md`, `_dev/MEMORY.md` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── package.json                                    # GÜNCELLE
└── src/
    ├── server.ts                                   # GÜNCELLE (pino redact)
    └── observability/
        ├── sentry.ts                               # YENİ
        ├── pii-scrubber.ts                         # YENİ
        └── pii-scrubber.test.ts                    # YENİ
shared/src/
├── pii-fields.ts                                   # YENİ
└── index.ts                                        # GÜNCELLE
_dev/
├── docs/sentry-setup.md                            # YENİ
├── memory/kvkk-pii-scrubbing-matrisi.md            # YENİ
└── MEMORY.md                                       # GÜNCELLE
```

---

## Dikkat Noktaları

- **3 katmanlı scrubbing (Araştırma):** (a) Sentry SDK default `sendDefaultPii: false`, (b) `beforeSend` custom scrubber, (c) pino fast-redact. Üçü birlikte savunma derinliği sağlar; biri bypass edilse diğeri yakalar.
- **User ID hash:** Sentry'de user grouping için hash'lenmiş ID yeterli; ham ID + telefon eşleştirmesi yapılırsa KVKK ihlal.
- **DSN'i `EXPO_PUBLIC_SENTRY_DSN` formatında mobile için ayrı tutulur** (TASK-1.12); backend DSN ayrı proje.
- **Quota webhook (Tuzak #7):** Free plan 5K event/ay; aşılırsa silently drop. Webhook'la haberdar oluruz.
- **Production'da `tracesSampleRate: 0.1`** ($26/ay Team plan'a geçişe kadar quota koruması); staging'de 1.0.
- **Test'te Sentry'ye gerçek HTTP call yok** — `Sentry.init({ transport: customTestTransport })` ile payload yakalanır, network call atılmaz.

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/backend test` — pii-scrubber.test.ts PASS (3 test)
- [ ] PII alanları içeren bir hata fırlatıldığında (manuel test) Sentry dashboard'da event'in `request.data`, `user`, `extra` bölümlerinde **ham PII yok**
- [ ] Pino log JSON'unda sağlık verisi alanları `[REDACTED]`
- [ ] User context'te sadece hash'li `id`, ham `phone` veya `name` yok
- [ ] Sentry DSN eksik env ile app start ediyor (degrade çalışıyor, hata fırlatmıyor)
- [ ] Quota webhook konfigürasyonu dokümante edildi (Sentry UI ekran görüntüsü değil — `docs/sentry-setup.md` adım rehberi)
- [ ] Memory `kvkk-pii-scrubbing-matrisi.md` PII alanları + ekleme disiplini içeriyor

---

## Karar Noktaları

- **Hash algoritması user ID için:** sha256 (12 karakter prefix) yeterli mi, yoksa HMAC + secret? → sha256 prefix öneririm (anonimizasyon yeterli, secret rotate gerekmez); KVKK denetimi açısından "ham veri Sentry'ye gitmiyor" beyanı yeterli.

---

## Risk ve Geri Dönüş Planı

- **Risk:** PII_FIELDS listesi eksik (yeni alan eklendiğinde unutulur) → KVKK ihlal sessizce sızar.
  - **Mitigation:** Memory'deki "PII scrubbing matrisi" disiplini + DB schema'ya yeni alan eklerken (TASK-1.13/1.14) review'da PII_FIELDS update kontrolü.
  - **Yedek savunma:** Pino redact `paths` wildcard ile geniş yakalar; ama yeni alan eklemek wildcard'a otomatik girmez — manuel ekleme şart.
- **Risk:** Test'te Sentry test transport yanlış kurarsa false positive (gerçek payload gönderiliyor sanıp aslında network'e gitmiyor).
  - **Mitigation:** Test transport'ı net izole + 1 manuel staging deneme (kontrollü PII event → Sentry dashboard inceleme).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.11): add sentry pii scrubber and pino redact on backend`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — 3 katmanlı PII scrubbing matrisi kararı
- [ ] MEMORY.md + `memory/kvkk-pii-scrubbing-matrisi.md` eklendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
