# TASK-1.11: Backend Sentry + PII scrubber + KVKK test

**Durum:** ✅ Tamamlandı
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

- [x] **1. Sentry SDK + fast-redact kurulumu**
  - `pnpm -F @alpfit/backend add @sentry/node fast-redact`
  - `backend/src/observability/sentry.ts` — `Sentry.init({ dsn, environment, tracesSampleRate: 0.1, beforeSend: piiScrubber })`
  - Region EU: DSN otomatik EU Frankfurt (Sentry Cloud EU)
  - Dosya: `backend/src/observability/sentry.ts`

- [x] **2. PII alan listesi (Single Source of Truth)**
  - `shared/src/pii-fields.ts` — `export const PII_FIELDS = ['phone', 'phoneNumber', 'name', 'firstName', 'lastName', 'weight', 'height', 'measurement', 'foodLog', 'meal', 'calories', 'note', 'kvkkConsent', ...]`
  - Tek dosyada tutulur; backend (pino + Sentry) + mobile (TASK-1.12 Sentry mobile) bu listeyi paylaşır
  - Dosya: `shared/src/pii-fields.ts`, `shared/src/index.ts` (UPDATE re-export)

- [x] **3. pino fast-redact konfigürasyonu**
  - `backend/src/server.ts` — pino instance `redact: { paths: PII_FIELDS.flatMap(f => [\`*.${f}\`, \`*.*.${f}\`, ...]), censor: '[REDACTED]' }`
  - PII alanları log JSON'unda `[REDACTED]` ile değiştirilir
  - Dosya: `backend/src/server.ts` (UPDATE)

- [x] **4. Sentry beforeSend PII scrubber**
  - `backend/src/observability/pii-scrubber.ts` — `beforeSend(event)` Sentry'ye gitmeden event objesi içinden PII_FIELDS'i recursive olarak siler
  - 3 katmanlı: (a) `event.request.data` (body), (b) `event.user` (Sentry user context), (c) `event.extra` + `event.contexts`
  - User ID **hash'lenir** (sha256(user_id) ilk 12 karakteri); ham user ID Sentry'ye gitmez
  - Dosya: `backend/src/observability/pii-scrubber.ts`

- [x] **5. Sentry quota webhook** *(rehber yazıldı; gerçek Sentry projesi açma + webhook ayarı kullanıcı tarafında yapılacak — `_dev/docs/sentry-setup.md` adım-adım talimat)*
  - Sentry projesi Settings → Quota → Webhook → Slack/email
  - `quota_exceeded` event'i Slack webhook'una bağlanır (Araştırma §Tuzak #7 mitigation)
  - **Manuel adım** — kullanıcı Sentry dashboard'unda yapar; rehber `_dev/docs/sentry-setup.md`
  - Dosya: `_dev/docs/sentry-setup.md`

- [x] **6. KVKK PII test (KRİTİK kabul kriteri)** *(11 test PASS — task spec'in 3 testinin üstüne genişletildi: Sentry beforeSend × 3, scrubPii recursive × 3, hashUserId × 3, pino redact × 1, negatif kanıt × 1)*
  - `backend/src/observability/pii-scrubber.test.ts`:
    - **Test 1 (Sentry beforeSend):** Mock event içinde `{ user: { phone: '+90555...', weight: 75 }, extra: { mealLog: 'omlet' } }` → `beforeSend(event)` çıktısında bu alanlar yok (undefined veya `[REDACTED]`)
    - **Test 2 (pino redact):** logger.info({ phone, weight, mealLog, password }) → stdout capture'da bu alanlar `[REDACTED]`
    - **Test 3 (negative):** Hash'lenmiş user ID `event.user.id` formatta var ama ham `phone` yok
  - Dosya: `backend/src/observability/pii-scrubber.test.ts`

- [x] **7. /healthz error logging smoke** *(`initSentry()` `SENTRY_DSN` yoksa no-op döner; `index.ts` `start()` akışında Sentry init başarısızsa app yine çalışır — degrade mode. Staging/prod'da DSN eksikse stderr'e warning.)*
  - Sentry init başarısızsa app start ETKİLENMEZ (DSN env eksikse warning + Sentry disabled, app çalışmaya devam eder)
  - Dosya: `backend/src/observability/sentry.ts` (env yoksa no-op pattern)

- [x] **8. Memory: PII scrubbing matrisi**
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

- [x] `pnpm -F @alpfit/backend test` — pii-scrubber.test.ts PASS (11 test, 3 değil; spec'in üstüne)
- [ ] PII alanları içeren bir hata fırlatıldığında (manuel test) Sentry dashboard'da event'in `request.data`, `user`, `extra` bölümlerinde **ham PII yok** *(staging deploy + gerçek Sentry projesi açıldıktan sonra yapılacak — `docs/sentry-setup.md §6` smoke senaryosu)*
- [x] Pino log JSON'unda sağlık verisi alanları `[REDACTED]` *(test "pino redact — KVKK log koruması" doğrular)*
- [x] User context'te sadece hash'li `id`, ham `phone` veya `name` yok *(test "Negative: scrubbed user.id is hash, raw phone removed" doğrular)*
- [x] Sentry DSN eksik env ile app start ediyor (degrade çalışıyor, hata fırlatmıyor) *(initSentry() DSN yoksa false döner, exception fırlatmaz; index.ts başlatma akışı bağımsız)*
- [x] Quota webhook konfigürasyonu dokümante edildi (Sentry UI ekran görüntüsü değil — `docs/sentry-setup.md` adım rehberi) *(§3)*
- [x] Memory `kvkk-pii-scrubbing-matrisi.md` PII alanları + ekleme disiplini içeriyor

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

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı (manuel staging Sentry smoke hariç — gerçek Sentry projesi açılınca)
- [x] Git commit & push yapıldı (`feat(TASK-1.11): add sentry pii scrubber and pino redact on backend`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi
- [x] DECISIONS.md — 3 katmanlı PII scrubbing matrisi kararı
- [x] MEMORY.md + `memory/kvkk-pii-scrubbing-matrisi.md` eklendi

---

## Oturum Kayıtları

### Oturum 2026-05-29 #1 ✅ Tamamlandı

**Yapılanlar:**

- `pnpm -F @alpfit/backend add @sentry/node fast-redact` — `@sentry/node@10.55.0` + `fast-redact@3.5.0` eklendi.
- `shared/src/pii-fields.ts` — SSOT PII_FIELDS readonly tuple (kimlik + sağlık + yemek + not + rıza + auth/sır kategorileri; camelCase + snake_case birlikte). `getPinoRedactPaths()` her alan için 4 seviye wildcard (`field`, `*.field`, `*.*.field`, `*.*.*.field`) üretir. `shared/src/index.ts` re-export edildi.
- `backend/src/observability/pii-scrubber.ts` — 3 export: `hashUserId()` (sha256 prefix 12), `scrubPii()` (recursive walk, immutable, WeakSet ile cyclic ref güvenli), `sentryBeforeSend<E extends Event>(e: E): E` (`event.request.{data,cookies,query_string,headers}` + `event.user` (id hash, email/username/ip_address sil) + `event.extra` + `event.contexts` + `event.breadcrumbs[].data` scrub eder). Sentry'nin `Event` (genel) vs `ErrorEvent` (`type: undefined`) tipi gerilimi generic ile çözüldü — Sentry beforeSend callback'i ErrorEvent geçiriyor, scrubber genel walk yapıyor.
- `backend/src/observability/sentry.ts` — `initSentry({env})` Sentry.init `sendDefaultPii: false` + `beforeSend: sentryBeforeSend` + `tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0` + `environment: env.APP_ENV` + `release: env.SENTRY_RELEASE` ile çağırır. DSN yoksa no-op + (staging/prod'da) stderr warning; app çalışmaya devam eder.
- `backend/src/server.ts` — `buildLoggerConfig()` pino instance'ına `redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' }` eklendi (hem prod hem dev path'leri redact eder).
- `backend/src/index.ts` — `start()` akışına `initSentry({env})` çağrısı `buildServer()` çağrısından önce eklendi.
- `backend/src/observability/pii-scrubber.test.ts` — **11 test PASS**: Sentry beforeSend (3), scrubPii recursive (3), hashUserId (3), pino redact (1), negatif kanıt (1). Sentry SDK gerçekten init edilmez (network/global state riski) — scrubber doğrudan çağrılır. Pino test'inde write destination capture ile JSON line üzerinde `[REDACTED]` ve raw PII'ın olmadığı assertion'lar.
- `_dev/docs/sentry-setup.md` — Sentry Cloud EU proje açma + DSN env wiring + quota webhook (80%/100%) + Spike Protection + KVKK Security & Privacy checklist + release tracking opsiyonel + manuel staging smoke senaryosu + haftalık quota izleme disiplini.
- `_dev/memory/kvkk-pii-scrubbing-matrisi.md` — Süreç Disiplini: PII_FIELDS SSOT, 3 katmanlı savunma matrisi, 4 kontrol anı (DB schema task'i, yeni endpoint task'i, PR review, faz review), wildcard sınırı uyarısı, test bağı.
- `_dev/MEMORY.md` index'inde "Süreç Disiplinleri" altına pointer eklendi.
- `_dev/docs/DECISIONS.md` — "2026-05-29 — TASK-1.11: 3 Katmanlı KVKK PII Scrubbing Matrisi" kararı en üste eklendi (bağlam + 4 seçenek + seçim + tamamlayıcı kararlar + gerekçe + tradeoff'lar + ilgili dosyalar).

**Test Sonuçları (final, oturum sonu):**

- `pnpm -F @alpfit/backend test` → 20 PASS (3 file, healthz + pii-scrubber).
- `pnpm -F @alpfit/backend typecheck` → temiz.
- `pnpm lint` → temiz (toLowerCase yasağı bu task'te tetiklenmiyor).
- `pnpm format:check` → temiz.
- `pnpm typecheck` (recursive shared + mobile + backend) → temiz.
- `pnpm test` (recursive) → tüm paketler PASS.

**Sonuç:**

3 katmanlı KVKK PII savunması (`sendDefaultPii: false` + Sentry `beforeSend` recursive scrubber + pino fast-redact paths) backend'de yerleşti. PII_FIELDS SSOT'u `@alpfit/shared` üzerinden TASK-1.12 mobile Sentry için hazır. Sentry init DSN yoksa no-op — app start akışı bağımsız. 11 test scrubber zincirini doğrular. Sentry projesi açma + DSN env yazma + UI ayarları kullanıcı tarafında — `docs/sentry-setup.md` adım-adım rehber.

**Kalan İşler:**

- Yok. (Manuel staging Sentry smoke = `docs/sentry-setup.md §6` — gerçek Sentry projesi açıldığında yapılır; kapsam dışı: hazır kod + rehber teslim edildi.)

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (oturum #1)
