/**
 * TR locale string normalizasyonu.
 *
 * JS spec'in default `.toLowerCase()` / `.toUpperCase()` davranışı Türkçe
 * "İ" → "i̇" (i + combining dot above) üretir; `tr-TR` locale ile çağrı doğru
 * `i` / `İ` sonucunu verir. Tüm üye arama, telefon doğrulama, isim eşleştirme
 * yollarında bu util kullanılır. Ham `.toLowerCase()` / `.toUpperCase()` ESLint
 * `no-restricted-syntax` kuralı ile yasaklıdır (eslint.config.mjs).
 */
export function trLower(input: string): string {
  return input.toLocaleLowerCase('tr-TR');
}

export function trUpper(input: string): string {
  return input.toLocaleUpperCase('tr-TR');
}
