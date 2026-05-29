# TASK-1.06: TR locale util + lint kuralı (toLowerCase yasağı)

**Durum:** ⬜ Bekliyor
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

- [ ] **1. shared/locale.ts util fonksiyonları**
  - `trLower(s: string): string` — `s.toLocaleLowerCase('tr-TR')` wrapper
  - `trUpper(s: string): string` — `s.toLocaleUpperCase('tr-TR')` wrapper
  - Unit test: `trLower('İSTANBUL') === 'istanbul'`, `trUpper('istanbul') === 'İSTANBUL'`
  - Dosya: `shared/src/locale.ts`, `shared/src/locale.test.ts`

- [ ] **2. shared/phone.ts — +90 telefon util**
  - `libphonenumber-js` deps (shared workspace'e)
  - `parseTrPhone(input: string): { e164: string, valid: boolean }` — gelen `+90 555 ...` veya `0555 ...` formatlarını E.164'e (`+905551234567`) çevirir
  - `formatTrPhone(e164: string): string` — `+90 555 123 45 67` insan-okur formata çevirir
  - `validateTrPhone(input: string): boolean` — sadece TR (+90) kabul, mobil prefix (5XX) zorunlu
  - Unit test: TR mobil kabul, sabit hat reddet, yabancı numara reddet
  - Dosya: `shared/src/phone.ts`, `shared/src/phone.test.ts`

- [ ] **3. shared/date.ts — TR tarih + saat util**
  - `date-fns` + `date-fns/locale/tr` deps
  - `formatTrDate(d: Date): string` — `29 Mayıs 2026` (dd MMMM yyyy + TR locale)
  - `formatTrDateShort(d: Date): string` — `29 May 2026`
  - `formatTrTime(d: Date): string` — `14:30` (24 saat)
  - `formatTrDateTime(d: Date): string` — `29 Mayıs 2026, 14:30`
  - Tüm fonksiyonlar timezone `Europe/Istanbul` varsayar (M3 motorunun gerektireceği baseline)
  - Unit test: format çıktıları, DST sınırı kontrolü
  - Dosya: `shared/src/date.ts`, `shared/src/date.test.ts`

- [ ] **4. shared/src/index.ts'den re-export**
  - `export * from './locale'`, `./phone`, `./date`
  - Dosya: `shared/src/index.ts` (UPDATE)

- [ ] **5. ESLint no-restricted-syntax kuralı**
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

- [ ] **6. Backend + mobile entry'lerinden import edilebilirlik smoke**
  - `backend/src/server.ts` veya helper'ında `import { trLower } from '@alpfit/shared'` çalışır
  - `mobile/app/index.tsx`'te aynı import çalışır
  - Compile + typecheck'te alias düzgün resolve eder
  - Dosya: shared paket tüketimi smoke testi (mevcut dosyalarda 1-2 satır kullanım)

---

## Etkilenen Dosyalar

```
shared/
├── package.json                # GÜNCELLE (libphonenumber-js, date-fns)
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

- [ ] `pnpm -F @alpfit/shared test` — tüm util testleri PASS
- [ ] Ham `.toLowerCase()` içeren dummy dosya → `pnpm lint` FAIL eder, mesaj okunabilir
- [ ] Backend + mobile entry'sinde `import { trLower } from '@alpfit/shared'` typecheck geçer
- [ ] `parseTrPhone('0555 123 45 67').e164 === '+905551234567'`
- [ ] `parseTrPhone('+1 555 ...')` → `valid: false` (yabancı reddedildi)
- [ ] `formatTrDate(new Date('2026-05-29'))` → `'29 Mayıs 2026'`
- [ ] DST sınırında (örn. son pazar mart) tarih formatı doğru
- [ ] Memory dosyası + MEMORY.md index güncel; doc-scan.sh ile boyut kontrol

---

## Karar Noktaları

- **shared/ test runner:** Ayrı `shared/vitest.config.ts` (backend gibi) mı, yoksa root'tan global Vitest mi? → Ayrı önereyim, paket bağımsızlığı için daha sağlam ([[ilkeler]] §"Kalıcılık önceliği").

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.06): add tr locale utils with phone date helpers and lint guard`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — TR locale util + lint kuralı kararı
- [ ] MEMORY.md + `memory/tr-locale-util-zorunlu.md` eklendi (Süreç Disiplinleri kategorisi)

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
