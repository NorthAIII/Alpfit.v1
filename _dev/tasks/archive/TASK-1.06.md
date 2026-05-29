# TASK-1.06: TR locale util + lint kuralı (toLowerCase yasağı)

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.01, TASK-1.02, TASK-1.05

---

## Hedef

`shared/` paketine TR locale util fonksiyonlarını yaz — `trLower`, `trUpper`, `formatTrPhone`, `parseTrPhone`, `formatTrDate`, `formatTrTime` — ve **ESLint kuralı** ekle: ham `.toLowerCase()` / `.toUpperCase()` çağrıları yasak (Türkçe "İ" tuzağı). Hem mobile hem backend bu util'leri import edip kullanır. Bu task Araştırma §Tuzak #5 (TR locale tuzağı) mitigation'ının kendisidir.

---

## Bağlam

JS `'İ'.toLowerCase() === 'i̇'` (Unicode I-with-dot) — Türkçe "İ" → "i" yapmaz. Bu hata kullanıcı arama, telefon doğrulama, isim eşleştirmede silent bug üretir. [[ilkeler]] §"Kalıcılık önceliği" — bu util'i şimdi kurmak Yakın 2'deki ilk arama bug'ını engeller. Lint kuralı **kaçınılmaz hatırlatma**: yeni geliştirici (gelecekteki Claude oturumu dahil) yanlışlıkla ham `.toLowerCase()` yazarsa lint kırar.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §5 (TR Locale Temeli)
- `_dev/phases/PHASE-1.md` — Araştırma → Dikkat Edilecekler #5 (TR locale tuzağı) + Kullanılacak Araçlar (libphonenumber-js, date-fns + tr locale)
- `_dev/ILKELER.md` §"Kalıcılık önceliği"
- `CLAUDE.md` → Projeye Özgü Kurallar → TR Yerelleştirme

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — `shared/locale.ts` util + lint kuralı kararı
- `_dev/memory/` — TR locale util varlığı + lint kuralı kalıcı hatırlatma (memory dosyası: `tr-locale-util-zorunlu.md` + MEMORY.md index)

---

## Alt Görevler

- [x] **1. shared/locale.ts util fonksiyonları**
  - `trLower(s: string): string` — `s.toLocaleLowerCase('tr-TR')` wrapper
  - `trUpper(s: string): string` — `s.toLocaleUpperCase('tr-TR')` wrapper
  - Unit test: `trLower('İSTANBUL') === 'istanbul'`, `trUpper('istanbul') === 'İSTANBUL'`
  - Dosya: `shared/src/locale.ts`, `shared/src/locale.test.ts`

- [x] **2. shared/phone.ts — +90 telefon util**
  - `libphonenumber-js` deps (shared workspace'e)
  - `parseTrPhone(input: string): { e164: string, valid: boolean }` — gelen `+90 555 ...` veya `0555 ...` formatlarını E.164'e (`+905551234567`) çevirir
  - `formatTrPhone(e164: string): string` — `+90 555 123 45 67` insan-okur formata çevirir
  - `validateTrPhone(input: string): boolean` — sadece TR (+90) kabul, mobil prefix (5XX) zorunlu
  - Unit test: TR mobil kabul, sabit hat reddet, yabancı numara reddet
  - Dosya: `shared/src/phone.ts`, `shared/src/phone.test.ts`

- [x] **3. shared/date.ts — TR tarih + saat util**
  - `date-fns` + `date-fns/locale/tr` deps
  - `formatTrDate(d: Date): string` — `29 Mayıs 2026` (dd MMMM yyyy + TR locale)
  - `formatTrDateShort(d: Date): string` — `29 May 2026`
  - `formatTrTime(d: Date): string` — `14:30` (24 saat)
  - `formatTrDateTime(d: Date): string` — `29 Mayıs 2026, 14:30`
  - Tüm fonksiyonlar timezone `Europe/Istanbul` varsayar (M3 motorunun gerektireceği baseline)
  - Unit test: format çıktıları, DST sınırı kontrolü
  - Dosya: `shared/src/date.ts`, `shared/src/date.test.ts`

- [x] **4. shared/src/index.ts'den re-export**
  - `export * from './locale'`, `./phone`, `./date`
  - Dosya: `shared/src/index.ts` (UPDATE)

- [x] **5. ESLint no-restricted-syntax kuralı**
  - `eslint.config.js`'e kural eklenir:
    ```js
    'no-restricted-syntax': ['error',
      {
        selector: "CallExpression[callee.property.name='toLowerCase']:not([arguments.length>=1])",
        message: 'Ham toLowerCase() yasak. @alpfit/shared/locale → trLower() kullan.'
      },
      {
        selector: "CallExpression[callee.property.name='toUpperCase']:not([arguments.length>=1])",
        message: 'Ham toUpperCase() yasak. @alpfit/shared/locale → trUpper() kullan.'
      }
    ]
    ```
  - **İstisna:** `locale.ts` içinde `toLocaleLowerCase('tr-TR')` çalışır (argümanlı çağrı; kural argument count'a göre regex filtreler)
  - Test: bir dosyada ham `'X'.toLowerCase()` yaz, `pnpm lint` FAIL eder
  - Dosya: `eslint.config.js` (UPDATE)

- [x] **6. shared/ Vitest config (test runner)**
  - `shared/vitest.config.ts` — ayrı config, `environment: 'node'`, default reporter (backend gibi)
  - `shared/package.json` script: `"test": "vitest run"`, `"test:watch": "vitest"`
  - Dev deps: `pnpm -F @alpfit/shared add -D vitest @vitest/coverage-v8`
  - Karar: ayrı `shared/vitest.config.ts` (backend'in `vitest.config.ts`'sinden bağımsız) — paket bağımsızlığı için ([[ilkeler]] §"Kalıcılık önceliği")
  - Dosya: `shared/vitest.config.ts`, `shared/package.json`

- [x] **7. Backend + mobile entry'lerinden import edilebilirlik smoke**
  - `backend/src/server.ts` veya helper'ında `import { trLower } from '@alpfit/shared'` çalışır
  - `mobile/app/index.tsx`'te aynı import çalışır
  - Compile + typecheck'te alias düzgün resolve eder
  - Dosya: shared paket tüketimi smoke testi (mevcut dosyalarda 1-2 satır kullanım)

---

## Etkilenen Dosyalar

```
shared/
├── package.json                # GÜNCELLE (libphonenumber-js, date-fns, vitest)
├── vitest.config.ts            # YENİ
└── src/
    ├── index.ts                # GÜNCELLE (re-export)
    ├── locale.ts               # YENİ
    ├── locale.test.ts          # YENİ
    ├── phone.ts                # YENİ
    ├── phone.test.ts           # YENİ
    ├── date.ts                 # YENİ
    └── date.test.ts            # YENİ
eslint.config.js                # GÜNCELLE (no-restricted-syntax)
_dev/memory/
└── tr-locale-util-zorunlu.md   # YENİ
_dev/MEMORY.md                  # GÜNCELLE (index pointer)
```

---

## Dikkat Noktaları

- **Memory yazımı zorunlu:** Bu kural projenin geneline yayılan kalıcı süreç disiplinidir → `_dev/memory/tr-locale-util-zorunlu.md` + MEMORY.md index'te "Süreç Disiplinleri" kategorisi altına eklenir.
- **Argümanlı `.toLocaleLowerCase('tr-TR')` yasal** — lint kuralı sadece argümansız ham `.toLowerCase()`'i yakalar (selector `:not([arguments.length>=1])`).
- **Test pattern'inde ham `.toLowerCase()` kullanmayın** — test verisi de lint'ten geçmek zorunda; test fixture string'leri direkt lowercase yazılır.
- **Performans:** `toLocaleLowerCase` ham `toLowerCase`'den ~2x yavaş ama ölçek korkusu yok (string ops mikro maliyet); doğruluk performansa baskındır ([[ilkeler]] §"Kalıcılık önceliği").
- **Shared'ın Vitest config'i:** Bu task'ta shared paketinde test yazıyoruz — Vitest config shared'a da eklenir (TASK-1.04 backend'e özel). Sade: `shared/vitest.config.ts` yoksa root config (TASK-1.04'tekiyle benzer) tek dosya olarak yazılır, ya da pnpm-flat. **Karar noktası → aşağıda.**

---

## Test Kriterleri

- [x] `pnpm -F @alpfit/shared test` — tüm util testleri PASS (41 test, 3 dosya, 0.66s)
- [x] Ham `.toLowerCase()` içeren dummy dosya → `pnpm lint` FAIL eder, mesaj okunabilir (smoke: `shared/src/__smoke.ts` ile 2 error doğrulandı; dosya silindi)
- [x] Backend + mobile entry'sinde `import { ... } from '@alpfit/shared'` typecheck geçer (backend `formatTrDateTime` boot log, mobile `formatTrDate` landing subtitle; mobile export web 1185 modül 1.6MB)
- [x] `parseTrPhone('0555 123 45 67').e164 === '+905551234567'`
- [x] `parseTrPhone('+1 555 ...')` → `valid: false` (yabancı reddedildi)
- [x] `formatTrDate(new Date('2026-05-29'))` → `'29 Mayıs 2026'`
- [x] DST sınırında doğru — Türkiye 2016'dan beri DST kullanmıyor; Mart sonu + Ekim sonu UTC+3 sabit test edildi (`Europe/Istanbul` IANA tz)
- [x] Memory dosyası + MEMORY.md index güncel

---

## Karar Noktaları

> shared/ Vitest config (ayrı `shared/vitest.config.ts`) kararı onaylandı (verify-plan oturumu) — alt görev 6'da uygulanır. Açık karar noktası kalmadı.

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.06): add tr locale utils with phone date helpers and lint guard`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi
- [x] DECISIONS.md — TR locale util + lint kuralı + Metro/pnpm resolution kararı
- [x] MEMORY.md + `memory/tr-locale-util-zorunlu.md` eklendi (Süreç Disiplinleri kategorisi)

---

## Oturum Kayıtları

### Oturum 2026-05-29 (run-task)
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `shared/src/locale.ts` — `trLower(s)` / `trUpper(s)` `toLocaleLowerCase/Upper('tr-TR')` wrapper'ı; 16 unit test (İSTANBUL/İĞNE/IŞIK edge case'leri + JS default'tan farkı için codepoint assertion: `'İ'`'in trLower'ı tek karakter `'i'` U+0069, JS default `'i̇'` U+0069+U+0307).
- `shared/src/phone.ts` — `libphonenumber-js/mobile` build kullanarak `parseTrPhone` / `formatTrPhone` / `validateTrPhone`; `country !== 'TR'` OR `isValid() === false` (mobil-only metadata) → invalid. 16 test: +90/0/yalın TR mobil ✓; sabit hat 212/312 ✗; yabancı +1/+44 ✗; çöp ✗; boş ✗.
- `shared/src/date.ts` — `formatInTimeZone(d, 'Europe/Istanbul', fmt, { locale: tr })` baz; `formatTrDate` ("29 Mayıs 2026"), `formatTrDateShort` ("29 May 2026"), `formatTrTime` ("14:30"), `formatTrDateTime` ("29 Mayıs 2026, 14:30"). 9 test: TR ay isimleri (Ocak/Mayıs/Aralık), TR saat dilimi UTC+3 sabit (Türkiye 2016'dan beri DST kullanmıyor — Mart sonu + Ekim sonu explicit doğrulandı), gece yarısı sınırı (UTC 21:30 → TR 00:30 ertesi gün).
- `shared/src/index.ts` — `export * from './locale.js'` + phone + date (NodeNext stilinde `.js` extension).
- `shared/vitest.config.ts` — bağımsız config, `env.TZ = 'Europe/Istanbul'` double-safety, coverage v8.
- `shared/package.json` — `libphonenumber-js@^1.13.3` + `date-fns@^4.3.0` + `date-fns-tz@^3.2.0` + devDeps vitest + @vitest/coverage-v8 (^4.1.7 line); `test` / `test:watch` / `test:coverage` script'leri.
- `eslint.config.mjs` — `no-restricted-syntax` kuralı eklendi (TS files only): selector `CallExpression[callee.property.name='toLowerCase']:not([arguments.length>=1])` + `toUpperCase` aynı; mesaj TR sade dilde `@alpfit/shared → trLower()` yönlendirir. Argümanlı `.toLocaleLowerCase('tr-TR')` (locale.ts kendi içinde) selector'dan istisna. Header comment'i TASK-1.06 placeholder'dan aktif duruma güncellendi.
- **Smoke verification (lint):** `shared/src/__smoke.ts` geçici dosyaya `'X'.toLowerCase() / .toUpperCase()` yazıldı → `pnpm exec eslint` 2 error verdi, mesajlar okunabilir; dosya silindi.
- `backend/src/index.ts` — `formatTrDateTime(new Date())` boot log alanına (`server started` event).
- `mobile/app/index.tsx` — `formatTrDate(new Date())` landing subtitle'da (TR tarih + TASK-1.26 hatırlatması).
- `backend/package.json` pretypecheck → `pnpm db:generate && pnpm -F @alpfit/shared build` (composite + project ref TS auto-build yapmıyor; shared dist deterministik tutulur).
- `mobile/metro.config.js` — iki ek: (a) `.js → .ts/.tsx` resolveRequest fallback (NodeNext source'unu Metro'ya tanıt); (b) `nodeModulesPaths += workspaceRoot/shared/node_modules` (pnpm izole layout'unda shared transitive deps mobile flat-hoist'una gelmiyordu).
- `_dev/docs/DECISIONS.md` — "TR Locale Util Paketi + ESLint + Metro/pnpm Resolution" girdisi (en üstte; 4 seçenek tablosu + tamamlayıcı uygulama kararları + tradeoffs + risk/mitigation).
- `_dev/memory/tr-locale-util-zorunlu.md` (yeni) + `_dev/MEMORY.md` index → Süreç Disiplinleri kategorisine pointer.
- `_dev/DURUM.md` + `_dev/phases/PHASE-1.md` task tablosu güncel.

**Test kriterleri ✅** — `pnpm test` 44 passed (41 shared + 3 backend), `pnpm lint` temiz, `pnpm typecheck` 3 paket temiz (backend pretypecheck shared rebuild zinciri çalışıyor), `pnpm format:check` temiz, `pnpm -F @alpfit/mobile run export:smoke` 1185 modül 1.6MB web bundle başarılı (Metro shim + node_modules path doğrulandı).

**Önemli kararlar (mid-task):**
- **Metro `.js → .ts/.tsx` resolver shim** — `AskUserQuestion` ile dist-based shared alternatifine karşı onaylandı; CLAUDE.md feedback §"Varsayım Yok". Detay [DECISIONS.md → TR Locale Util Paketi](../docs/DECISIONS.md) (en üstte).
- **`shared/node_modules` Metro path** — pnpm izole layout + mobile-only hoisted ayağa kalkış paterni; alternatif (mobile'a libphonenumber-js direkt dep ekle) duplicate dep beyanı doğururdu.
- **date-fns-tz v3.2.0 + date-fns v4.3.0 uyumu** — sürpriz değil, sürpriz olabilirdi; smoke (41 test) doğruladı.

**Kalan İşler:** Yok.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (run-task)
