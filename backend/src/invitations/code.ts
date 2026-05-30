/**
 * Davet kodu üretimi + davet URL'i (TASK-1.23).
 *
 * Kod 6 karakter **Crockford base32** alfabesinden seçilir:
 *   0123456789ABCDEFGHJKMNPQRSTVWXYZ  (I, L, O, U yok)
 * I/L/O/U dışlanması okuma/dikte hatasını azaltır — PT davet kodunu sözlü
 * iletebilir (QR olmadan). 32^6 ≈ 1.07 milyar kombinasyon → çakışma olasılığı
 * çok düşük; yine de DB `code @unique` + create retry (route'ta max 3) garanti
 * sağlar.
 *
 * Bias notu: alfabe uzunluğu 32, byte değer aralığı 256 = 8 × 32 → `byte % 32`
 * modulo bias üretmez (256 tam bölünür). Bu yüzden rejection sampling gerekmez;
 * her byte tek bir alfabe indeksine eşit olasılıkla düşer.
 */
import { randomBytes } from 'node:crypto';

/** Crockford base32 alfabesi — I, L, O, U bilinçli dışlandı (insan-okunur). */
export const INVITATION_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Davet kodu uzunluğu — F1.1 PRD "6 karakterli". */
export const INVITATION_CODE_LENGTH = 6;

/** Davet URL path öneki — TR pazar için `/davet/` (kullanıcı dostu). */
const INVITATION_PATH = 'davet';

/**
 * 6 karakter Crockford base32 davet kodu üretir. Kriptografik rastgelelik
 * (`randomBytes`) kullanır; 256 % 32 === 0 olduğu için modulo bias yoktur.
 */
export function generateInvitationCode(): string {
  const bytes = randomBytes(INVITATION_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < INVITATION_CODE_LENGTH; i += 1) {
    // `bytes[i]` 0..255; 0..31'e indirgenir (bias yok — 256 = 8 × 32).
    code += INVITATION_CODE_ALPHABET[bytes[i]! % INVITATION_CODE_ALPHABET.length];
  }
  return code;
}

/**
 * `${baseUrl}/davet/{code}` davet linkini üretir. `baseUrl` sonundaki olası
 * trailing slash normalize edilir (çift slash önlenir).
 */
export function buildInvitationUrl(baseUrl: string, code: string): string {
  const normalized = baseUrl.replace(/\/+$/, '');
  return `${normalized}/${INVITATION_PATH}/${code}`;
}
