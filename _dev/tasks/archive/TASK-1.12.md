# TASK-1.12: Mobile Sentry crash reporting + PII scrubber

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.05, TASK-1.08, TASK-1.11

---

## Hedef

Mobile workspace'ine `sentry-expo` (veya `@sentry/react-native`) kur, crash reporting + JS error capture aktif, PII scrubber backend ile **aynı PII alan listesini** (`shared/pii-fields.ts`) kullanarak event payload'ından sağlık verisi alanlarını siler, breadcrumb'larda telefon/isim sızmıyor. Bir test event fırlatıldığında staging Sentry'de görünür ama PII içermez.

---

## Bağlam

Research-phase: Sentry tek araç (Node + RN), free plan EU Frankfurt residency dahil. KVKK çerçevesi mobile crash report'larında da geçerli — kullanıcı ekranda kilo girmişken crash olursa stack trace + state'te kilo değeri Sentry'ye gitmemeli. Backend'le **aynı `PII_FIELDS` listesini paylaşmak** drift'i önler ([[ilkeler]] §"Kalıcılık önceliği").

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §4, §8
- `_dev/phases/PHASE-1.md` — Araştırma → Observability
- `_dev/QUALITY.md` §2 (Güvenlik & Gizlilik)
- TASK-1.11 — PII scrubber matrisi (referans)
- `_dev/memory/kvkk-pii-scrubbing-matrisi.md`

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [x] **1. Sentry mobile SDK kurulumu**
  - `pnpm -F @alpfit/mobile add @sentry/react-native`
  - Expo SDK 56 ile uyumlu version (`expo install` ile uyumlu sürüm tespiti)
  - `mobile/app.config.ts` Sentry Expo plugin (build-time source map upload için Yakın 5'te aktive; bu fazda yapısı kurulu)
  - Dosya: `mobile/package.json`, `mobile/app.config.ts`

- [x] **2. Sentry init (mobile entry)**
  - `mobile/src/observability/sentry.ts` — `Sentry.init({ dsn: EXPO_PUBLIC_SENTRY_DSN, environment, enabled: isProductionOrStaging, tracesSampleRate: 0.1, beforeSend: piiScrubber })`
  - DSN yoksa Sentry disabled, app çalışır (degrade)
  - `mobile/app/_layout.tsx` — `Sentry.wrap(RootLayout)` veya `<ErrorBoundary>` wrap
  - Dosya: `mobile/src/observability/sentry.ts`, `mobile/app/_layout.tsx` (UPDATE)

- [x] **3. PII scrubber (shared list)**
  - `mobile/src/observability/pii-scrubber.ts` — backend ile aynı pattern: `event.user`, `event.extra`, `event.breadcrumbs[].data` üzerinde recursive PII siler
  - `shared/src/pii-fields.ts` import edilir (drift yok)
  - User ID hash'lenir (sha256, ilk 12 karakter; crypto-js veya expo-crypto)
  - Dosya: `mobile/src/observability/pii-scrubber.ts`

- [x] **4. Breadcrumb policy**
  - Default Sentry breadcrumb'lar (navigation, network) → hassas URL'ler (`/me/measurements`, `/me/food-log`) için custom transformer URL path'i sansürler veya breadcrumb'ı drop eder
  - HTTP breadcrumb body **gönderilmez** (`Sentry.addBreadcrumb` policy)
  - Dosya: `mobile/src/observability/sentry.ts` (UPDATE breadcrumb config)

- [x] **5. Test event (smoke)**
  - `mobile/src/observability/sentry.test.ts` — beforeSend mock event PII silme testi (backend test pattern'ine paralel)
  - Manuel staging smoke: `Sentry.captureMessage('test event', { extra: { phone: '+90555...' } })` → Sentry dashboard'da phone yok
  - Dosya: `mobile/src/observability/sentry.test.ts`

- [x] **6. .env.example güncelle**
  - `EXPO_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/0` placeholder
  - Dosya: `mobile/.env.example` (UPDATE)

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                              # GÜNCELLE
├── app.config.ts                             # GÜNCELLE (Sentry plugin)
├── .env.example                              # GÜNCELLE
├── app/_layout.tsx                           # GÜNCELLE (wrap)
└── src/observability/
    ├── sentry.ts                             # YENİ
    ├── pii-scrubber.ts                       # YENİ
    └── sentry.test.ts                        # YENİ
```

---

## Dikkat Noktaları

- **Source map upload Yakın 5'te:** EAS Build pipeline'ı bu fazda yok; source map'siz crash report'lar minified stack trace gösterir (dev'de kabul edilebilir, production'da pilot için gerekli).
- **Breadcrumb hassas URL filtrelemesi:** Sustain motoru ekran path'leri (`/measurements/123`) gibi navigation breadcrumb'ları içerik (üye ID) sızdırabilir; transformer breadcrumb'ı drop veya generic'leştirir.
- **`EXPO_PUBLIC_*` env client bundle'da görünür** — DSN public (gizli değil, Sentry kabul); secret olmamalı, DSN sadece ingest endpoint'i.
- **Mobile + backend aynı `shared/pii-fields.ts`** — yeni alan eklenirken TASK-1.11 memory disiplini ikisini birden kapsar.

---

## Test Kriterleri

- [x] `pnpm -F @alpfit/mobile test` — pii-scrubber + sentry init testleri PASS
- [x] DSN env eksikse app boot eder, Sentry disabled
- [x] Mock event'te PII alanları silinmiş olarak `beforeSend` çıktısı
- [x] Breadcrumb transformer hassas URL'leri generic'leştirir (`/me/measurements/123` → `/me/measurements/[id]`)
- [x] Manuel staging smoke (Yakın 1 son task'inde uçtan uca smoke ile): test event Sentry dashboard'da görünür, payload'da PII yok

---

## Karar Noktaları

- **`sentry-expo` mi `@sentry/react-native` mi:** Expo SDK 56 ile `@sentry/react-native` doğrudan desteklenir (sentry-expo deprecated). → `@sentry/react-native` öneririm.

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.12): add sentry crash reporting and pii scrubber to mobile`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-29 ✅ Tamamlandı

**Yapılanlar:**

- **Paket kurulumu:** `pnpm -F @alpfit/mobile add @sentry/react-native@^8.13.0 crypto-js@^4.2.0` + dev `@types/crypto-js@^4.2.2`. Sentry RN peer deps `expo: >=49.0.0`, RN `>=0.65.0` — Expo SDK 56 + RN 0.85 hedefiyle uyumlu. Karar noktası: task plan'ı `sentry-expo` vs `@sentry/react-native` ikilemini sentry-expo deprecated olduğundan `@sentry/react-native` lehine kapatmıştı → uygulandı.
- **`mobile/src/observability/pii-scrubber.ts` (YENİ):** Backend `pii-scrubber.ts` kontratıyla birebir paralel. `scrubPii<T>(value)` recursive (immutable + WeakSet ile cyclic-safe), `PII_FIELD_SET = new Set(PII_FIELDS)` shared SSOT'u. `hashUserId(rawId)` — Node `crypto` yok; `crypto-js/sha256` + `crypto-js/enc-hex` ile sync sha256 → 12 hex char (KVKK kanıtı: `73475cb40a56` cross-platform parity testi backend ile aynı sonucu üretir). `sentryBeforeSend<E>(event)` — `event.request.{data, cookies, query_string, headers}` + `event.user` (id hash, email/username/ip_address sil) + `event.extra` + `event.contexts` + `event.breadcrumbs[].data` scrub. `sentryBeforeBreadcrumb(breadcrumb, hint)` — URL/from/to `sanitizeUrl`'den geçer + fetch/xhr/http kategorilerinde `request_body/response_body/body` drop + tüm `data` `scrubPii` recursive. Tip: `BreadcrumbHint` `@sentry/react-native` re-export ETMİYOR — `@sentry/core` transitive dep eklemek yerine yapısal `type BreadcrumbHint = Record<string, unknown>` (hint kullanılmıyor, sadece imza için).
- **`sanitizeUrl(rawUrl)` (YENİ):** `SENSITIVE_PATH_PATTERNS` listesi (`/me/measurements`, `/me/food-log`, `/me/notes`, `/pt/members`, `/members`, `/measurements`, `/food-log`, `/invites`) — bilinen hassas prefix sonrası segment'i `[id]` yapar. Ek defansif `ID_SEGMENT_REGEX` (`/\/(\d+|UUID|[a-z0-9]{16,})(?=[/?#]|$)/gi`) — lookahead'i `(?=[/?#]|$)` her alternatif yol-sınırına hizalı (aksi halde `\d+` UUID'nin ilk hex chunk'ını yiyor: `/api/x/550e8400-...-y` → `/api/x/[id]e8400-...-y` bug'ı; test failure'dan bulundu, düzeltildi). Yakın 3-4 endpoint'leri henüz yok ama transformer ileri-uyumlu hazır (memory KVKK matrisi disiplini).
- **`mobile/src/observability/sentry.ts` (YENİ):** `initSentry({dsn?, environment, release?})` — DSN boşsa `false` döner; staging/production'da `console.warn` (throw yok, degrade mode). `Sentry.init({dsn, environment, release, sendDefaultPii: false, tracesSampleRate: production? 0.1 : 1.0, beforeSend, beforeBreadcrumb, enableAutoSessionTracking: true})`. `initSentryFromEnv()` — `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_APP_ENV` (fallback `NODE_ENV` → `development`), `EXPO_PUBLIC_SENTRY_RELEASE` okur. `SentryEnvironment = 'development'|'staging'|'production'|'test'` type guard'lı parse. `Sentry` namespace re-export edilir (layout'tan `Sentry.wrap` için).
- **`mobile/app.config.ts` (UPDATE):** `plugins: [...(config.plugins ?? []), '@sentry/react-native/expo']` — Expo plugin'i kayıtlı ama auth token olmadan no-op (Yakın 5 EAS Build'de source map upload aktive). Dev/runtime side-effect yok.
- **`mobile/app/_layout.tsx` (UPDATE):** Module-level `initSentryFromEnv()` çağrısı (React render'dan ÖNCE boot-time hatalar yakalanır). `export default Sentry.wrap(RootLayout)` — init edilmemişse no-op error boundary.
- **`mobile/.env.example` (UPDATE):** `EXPO_PUBLIC_SENTRY_DSN=` placeholder + EU Frankfurt residency açıklaması + `EXPO_PUBLIC_APP_ENV=development` (Sentry environment + traces rate için). `EXPO_PUBLIC_*` bundle'a girer → DSN public (Sentry kabul, secret değil), salt ingest endpoint'i.
- **`sentry.test.ts` (YENİ, 23 test):** `jest.mock('@sentry/react-native')` — Sentry SDK gerçekten init edilmez (network/global state). `sentryBeforeSend` × 3 (kompleks event scrub, missing fields, breadcrumb data) + `scrubPii` × 2 (immutable, cyclic) + `hashUserId` × 4 (12-hex format, deterministic, distinct inputs, **Node sha256 cross-platform parity** — `hashUserId(42) === '73475cb40a56'` backend ile aynı) + `sanitizeUrl` × 4 (sensitive prefix, UUID anywhere, numeric anywhere, untouched paths) + `sentryBeforeBreadcrumb` × 3 (fetch URL+body drop, navigation to/from, ui.click PII scrub) + `initSentry` × 4 (degrade no-DSN, production warn, init args PII-safe, traces rate 0.1 prod) + negatif kanıt × 1 (serialized event'te ham telefon/üye ID YOK). 23 PASS.
- **Format düzeltmesi:** İlk lint pass'ında `import/order` (3 hata: empty line, crypto-js sıralama) + unused `eslint-disable no-console` (1 warn) çıktı — import bloğu doğru sıralandı (`@alpfit/shared` → `crypto-js/enc-hex` → `crypto-js/sha256`), gereksiz directive kaldırıldı. Prettier 2 dosyada whitespace farkı buldu → `pnpm exec prettier --write` ile düzeltildi.

**Test Sonuçları:**

- `pnpm -F @alpfit/mobile test` → **23 PASS** (Sentry SDK mock + scrubber + transformer + init + negatif kanıt)
- `pnpm -F @alpfit/mobile typecheck` → temiz
- `pnpm typecheck` (recursive: shared + mobile + backend) → temiz
- `pnpm lint` (recursive eslint) → temiz
- `pnpm format:check` (prettier) → temiz
- `pnpm -F @alpfit/backend test` → **20 PASS** regression yok (PII_FIELDS SSOT paylaşımı backend'i kırmadı)
- `pnpm -F @alpfit/shared test` → **41 PASS** regression yok

**Karar Notları:**

- **crypto-js seçimi:** Task plan'ı `crypto-js veya expo-crypto` ikilemini açık bırakmıştı. `expo-crypto.digestStringAsync` async; Sentry RN v8 async beforeSend destekler ama her event'te promise overhead'i ve test'te expo-modules mock yükü var. `crypto-js/sha256` sync — `beforeSend` saf sync kalıyor, test'te mock'a gerek yok, ~14KB bundle (sadece sha256 + hex modülleri import). Bundle etkisi (kullanıcı seviyesi crash report — hot path değil) küçük; sync API + test kolaylığı daha değerli.
- **Sentry RN plugin minimal kurulum:** `@sentry/react-native/expo` plugin'i `app.config.ts` `plugins` array'ine eklendi. Source map upload pre-bundled değil — `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` env'leri yokken plugin no-op. Yakın 5'te EAS Build pipeline ile aktive (task plan disipliniyle uyumlu).
- **`mobile/.env.example` `EXPO_PUBLIC_APP_ENV` eklendi:** Task plan sadece `EXPO_PUBLIC_SENTRY_DSN` istemiş ama `initSentryFromEnv()` environment hesabı için ya `EXPO_PUBLIC_APP_ENV` ya `NODE_ENV` gerekiyor. Default fallback `'development'` — tek başına yeterli, ama placeholder belirgin olsun diye .env.example'a yazıldı. Production/staging deploy'da gerçek değer set edilecek.
- **Manuel staging smoke:** Test kriterleri listesinin son maddesi (gerçek Sentry projesinde test event görmek). Gerçek Sentry projesi açılmadan yapılamaz — kod + rehber (`docs/sentry-setup.md` TASK-1.11 ile teslim) hazır; "Yakın 1 son task'inde uçtan uca smoke" task plan zaten bu kontrolü ileri-task'e yönlendirmiş. Bu task scope'unda kabul edilmiştir.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (run-task)
