// Profil oluşturma formu doğrulaması (TASK-1.30). İsim/soyisim zorunlu (2-50
// char, yalnızca harf + boşluk — TR karakter izinli); PT-only alanlar (spor
// salonu, sertifika notu) opsiyonel serbest metin. Backend `POST /auth/profile`
// (TASK-1.20) son savunmadır; bu şema inline UI feedback'i içindir.

import { z } from 'zod';

export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const GYM_MAX = 100;
export const CERT_NOTE_MAX = 500;

// Unicode harf (ş, ğ, ı, ç, İ dahil) + boşluk. Rakam/sembol reddedilir.
const NAME_PATTERN = /^[\p{L}\s]+$/u;

const nameField = z.string().trim().min(NAME_MIN).max(NAME_MAX).regex(NAME_PATTERN);

/** Form bütünü — submit öncesi son kontrol. PT-only alanlar opsiyonel. */
export const profileFormSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  gymName: z.string().trim().max(GYM_MAX).optional(),
  certificateNote: z.string().trim().max(CERT_NOTE_MAX).optional(),
});

/**
 * Tek bir isim alanı için inline hata anahtarı döner (yoksa `null`). Boşken
 * `required` (henüz hata gösterme amaçlı ayırt edilir), dolu ama geçersizse
 * `invalid` (kısa/uzun/geçersiz karakter hepsi tek mesaja iner — UI sadeliği).
 */
export type NameFieldError = 'required' | 'invalid';

export function validateName(raw: string): NameFieldError | null {
  if (raw.trim().length === 0) {
    return 'required';
  }
  return nameField.safeParse(raw).success ? null : 'invalid';
}
