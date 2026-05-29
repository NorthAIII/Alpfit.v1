## TR locale util zorunlu — ham `.toLowerCase()` / `.toUpperCase()` yasak

**Süreç disiplini.** TR string'lere case dönüşümü uygularken **her zaman** `@alpfit/shared` → `trLower(s)` / `trUpper(s)` kullan. Ham `s.toLowerCase()` / `s.toUpperCase()` ESLint `no-restricted-syntax` kuralıyla yasaktır — lint kırar.

**Why:** JS spec default'u Türkçe değildir; `'İ'.toLowerCase()` → `'i̇'` (U+0069 + U+0307 combining dot above), `'i'.toUpperCase()` → `'I'` (noktasız I, TR'de yanlış). Üye arama, telefon doğrulama, isim eşleştirme, search index, deduplikasyon — silent bug zinciri. Cüneyt İlhan ↔ cüneyt ilhan eşleşmesi default'la kırılır; kullanıcı görmeden veri tutarsızlığı üretir. M3 motorunun streak hesabında üye-ID kaynağı arama kullanıyorsa motor yanlış üyeye veri yazar.

**How to apply:**
- **İcra anı:** Yeni kod yazarken (.ts / .tsx, mobile + backend + shared); test fixture yazarken — string normalizasyon gerekti mi `trLower` / `trUpper` import et.
- **Test fixture'larında ham `.toLowerCase()` yazma** — beklenen değeri direkt küçük harfle yaz: `expect(trLower('İSTANBUL')).toBe('istanbul')` (sağ taraf hardcoded). Aksi halde test dosyası kendi lint'ini kırar.
- **Argümanlı `.toLocaleLowerCase('tr-TR')` izinli** — `shared/src/locale.ts` kendi implementasyonunda kullanır. ESLint selector `:not([arguments.length>=1])` ile bu istisnayı handle eder. Ama doğrudan çağıracaksan yine de `trLower` import et (tek nokta + okunabilirlik).
- **`.localeCompare` / regex `/i` flag / `Intl.Collator` gibi case-insensitive operasyonlar** lint kuralı kapsamında **değil**. Onları kullanırken `{ sensitivity: 'accent', locale: 'tr' }` veya `Intl.Collator('tr', { sensitivity: 'base' })` ile TR-aware tercih et — gerekirse `trLower` ile pre-normalize edilebilir.
- **Yeni TR string util ihtiyacı** (örn. ASCII fold, slug, accent strip) çıkarsa: `@alpfit/shared`'a ekle, ham JS API'sini kullanan dağınık kodu engelle. Util tek nokta = TR davranışı tek noktadan yönetilir.

**Bağlantılı kayıtlar:** [Karar günlüğü](../docs/DECISIONS.md) §"TR Locale Util Paketi" (2026-05-29) — ESLint kuralı, util implementasyon detayı, libphonenumber-js mobile build, date-fns-tz seçimi. ESLint config: `eslint.config.mjs` `no-restricted-syntax` kuralı.

**Doğrulama:** TASK-1.06'da `shared/src/__smoke.ts` geçici dosyaya `'X'.toLowerCase()` yazıldı, `pnpm exec eslint` 2 error verdi:
```
Ham .toLowerCase() yasak (TR 'İ' → 'i̇' tuzağı). @alpfit/shared → trLower() kullan.
Ham .toUpperCase() yasak (TR 'i' → 'I' tuzağı). @alpfit/shared → trUpper() kullan.
```
Smoke dosyası silindi; lint kuralı kalıcı.
