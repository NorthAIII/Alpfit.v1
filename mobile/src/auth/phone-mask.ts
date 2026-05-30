// TR telefon mask + parser (TASK-1.27). Telefon ekranı bunu kullanarak
// kullanıcının yazdığı ham girdiyi `5XX XXX XX XX` grubuna böler ve
// `@alpfit/shared` → `parseTrPhone` ile +90 mobil doğrulaması yapar.
//
// Sınır: gerçek doğrulama mantığı (TR mobil prefix, E.164) `shared/phone.ts`'de
// tek kaynak; burası yalnızca ulusal-numara <-> ekran maskesi köprüsü. Mobile UI
// `+90` ön ekini sabit gösterir, kullanıcı yalnızca 10 haneli ulusal numarayı
// yazar — bu yüzden parse'tan önce `+90` eklenir.

import { parseTrPhone, type ParsedPhone } from '@alpfit/shared';

/** TR ülke kodu — ekranda sabit ön ek olarak gösterilir, input'a yazılmaz. */
export const TR_DIAL_CODE = '+90';

/** TR ulusal mobil numara uzunluğu (5XX XXX XX XX = 3+3+2+2). */
export const TR_NATIONAL_LENGTH = 10;

/**
 * Ham girdiden yalnızca ulusal mobil rakamları çıkarır.
 * Yapıştırılan tam numarayı tolere eder: baştaki ülke kodu (`90`) ya da
 * şehirlerarası `0` öneki atılır (TR mobil numara her zaman `5` ile başlar,
 * asla `0`/`90` ile — bu yüzden ayrım güvenli). En fazla 10 haneye kesilir.
 */
export function extractNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('90')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, TR_NATIONAL_LENGTH);
}

/**
 * Ulusal numarayı `5XX XXX XX XX` gruplarına böler. Kısmi girdide yalnızca
 * dolu gruplar görünür (`555123` → `555 123`), böylece kullanıcı yazarken
 * mask doğal ilerler.
 */
export function maskTrNational(raw: string): string {
  const d = extractNationalDigits(raw);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)]
    .filter((part) => part.length > 0)
    .join(' ');
}

/**
 * Ekrandaki ulusal girdiden E.164 + geçerlilik üretir. `+90` ön eki burada
 * eklenir; sabit-hat / yabancı / eksik numara `valid: false` döner.
 */
export function parseNationalTrPhone(raw: string): ParsedPhone {
  const d = extractNationalDigits(raw);
  if (d.length === 0) {
    return { e164: '', valid: false };
  }
  return parseTrPhone(`${TR_DIAL_CODE}${d}`);
}
