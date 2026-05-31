/**
 * Sessiz saat util — Europe/Istanbul 22:00–08:00.
 *
 * v1 TR-only pilot: timezone User tablosuna eklenmez (şişirme). Cihaz saat
 * dilimi edge case v1.5'te migration ile ele alınır.
 */

const TZ = 'Europe/Istanbul';

function nowInTurkey(): Date {
  // toLocaleString → Istanbul saatinde string → Date parse ile yerel saat elde edilir.
  // Doğrudan Date.getHours() TZ'ye duyarlı değildir; Intl ile dönüştürürüz.
  const str = new Date().toLocaleString('sv-SE', { timeZone: TZ });
  return new Date(str);
}

/** Europe/Istanbul 22:00–08:00 arasındaysa true döner. */
export function isInSilentHours(): boolean {
  const hour = nowInTurkey().getHours();
  return hour >= 22 || hour < 8;
}

/**
 * Ertesi gün `hour`:00 Istanbul zamanına kadar kalan milisaniye.
 * Comeback bildirimlerinin sessiz saate denk gelmesi durumunda
 * delay hesabında kullanılır.
 *
 * @param hour Hedef saat (varsayılan 9 = 09:00)
 */
export function msUntilTomorrowMorning(hour = 9): number {
  const now = new Date();

  // Istanbul'da "bugünkü hedef saat" (yerel UTC offset hesabı):
  // Bir sonraki hedef zamana UTC cinsinden ulaşmak için:
  //   1. Istanbul'da şu anki tarihi al
  //   2. Ertesi günü hedef saate ayarla
  //   3. Bu zamanın UTC karşılığını bul
  const turkeyNow = new Date(new Date().toLocaleString('sv-SE', { timeZone: TZ }));
  const tomorrow = new Date(turkeyNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, 0, 0, 0);

  // UTC offset farkını hesapla: Istanbul zamanı ile UTC arasındaki fark
  const utcOffsetMs = turkeyNow.getTime() - now.getTime();
  const tomorrowUtc = tomorrow.getTime() - utcOffsetMs;

  return Math.max(0, tomorrowUtc - now.getTime());
}
