import { tr } from 'date-fns/locale/tr';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * TR tarih + saat formatlayıcılar.
 *
 * Tüm fonksiyonlar `Europe/Istanbul` timezone'unu **system TZ'den bağımsız**
 * uygular (M3 sürdürülebilirlik motoru baseline'ı). `formatInTimeZone` Date
 * instant'ını hedef TZ'a çevirip locale ile formatlar — devcontainer UTC
 * çalışsa bile çıktı TR saatine göredir.
 *
 * Production runtime'da ayrıca `process.env.TZ = 'Europe/Istanbul'` set edilir
 * (TASK-1.10 Coolify deploy config'i); bu util onun yokluğunda da doğrudur.
 */
export const TR_TIMEZONE = 'Europe/Istanbul';

const LOCALE_OPTS = { locale: tr } as const;

/** `29 Mayıs 2026` */
export function formatTrDate(d: Date): string {
  return formatInTimeZone(d, TR_TIMEZONE, 'dd MMMM yyyy', LOCALE_OPTS);
}

/** `29 May 2026` */
export function formatTrDateShort(d: Date): string {
  return formatInTimeZone(d, TR_TIMEZONE, 'dd MMM yyyy', LOCALE_OPTS);
}

/** `14:30` (24 saat) */
export function formatTrTime(d: Date): string {
  return formatInTimeZone(d, TR_TIMEZONE, 'HH:mm', LOCALE_OPTS);
}

/** `29 Mayıs 2026, 14:30` */
export function formatTrDateTime(d: Date): string {
  return formatInTimeZone(d, TR_TIMEZONE, 'dd MMMM yyyy, HH:mm', LOCALE_OPTS);
}
