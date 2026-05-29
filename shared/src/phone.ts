import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile';

/**
 * TR telefon util'leri. Sadece +90 TR mobil prefix (5XX) numaraları kabul edilir.
 * Sabit hat (212, 312, ...) ve yabancı numaralar `valid: false` döner.
 *
 * libphonenumber-js'in `mobile` build'i mobil-only metadata ile gelir
 * (`isValid()` sabit hat için `false` döner) — `min` build'inden ~10KB büyük
 * ama TR mobil-only validasyonu garanti eder.
 */
export interface ParsedPhone {
  /** E.164 normalizasyonu (örn. `+905551234567`). Parse edilemezse boş string. */
  e164: string;
  /** TR mobil prefix + geçerli format. Sabit hat / yabancı → `false`. */
  valid: boolean;
}

export function parseTrPhone(input: string): ParsedPhone {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { e164: '', valid: false };
  }

  try {
    const parsed = parsePhoneNumberFromString(input, 'TR');
    if (!parsed) {
      return { e164: '', valid: false };
    }
    if (parsed.country !== 'TR') {
      return { e164: parsed.number, valid: false };
    }
    return { e164: parsed.number, valid: parsed.isValid() };
  } catch {
    return { e164: '', valid: false };
  }
}

/**
 * E.164 numarayı `+90 555 123 45 67` formatına çevirir.
 * Geçersiz girdi olduğu gibi döner (UI'de "—" göstermek isteyen çağıran
 * `validateTrPhone` ile filtrelemeli).
 */
export function formatTrPhone(e164: string): string {
  if (typeof e164 !== 'string' || e164.length === 0) {
    return e164;
  }
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (!parsed || !parsed.isValid()) {
      return e164;
    }
    return parsed.formatInternational();
  } catch {
    return e164;
  }
}

export function validateTrPhone(input: string): boolean {
  return parseTrPhone(input).valid;
}
