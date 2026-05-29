/**
 * OTP üretim + Redis depolama + verify/brute-force sözleşmesi (TASK-1.18/1.19).
 *
 * Güvenlik (QUALITY §2): kod `crypto.randomInt` ile üretilir — `Math.random`
 * KULLANILMAZ (tahmin edilebilir). **Send** tarafı (TASK-1.18) telefon-bazlı
 * rate limit (`otp:rate`) uygular. **Verify** tarafı (TASK-1.19) brute-force
 * korumasını uygular: her hatalı denemede `otp:attempts` atomik INCR'lenir,
 * `OTP_MAX_ATTEMPTS` (5) hatada `otp:lockout` 15dk için set edilir. Doğru kod
 * **atomik** tüketilir (`GETDEL otp:send`) — concurrent iki verify'da yalnızca
 * biri kazanır, ikincisi expired görür (replay/race koruması).
 */
import { randomInt, timingSafeEqual } from 'node:crypto';

import type { Redis } from '../redis/client.js';

/** OTP kod geçerlilik süresi (saniye) — F1.1 PRD: "5 dakika geçerli". */
export const OTP_TTL_SEC = 300;
/** Telefon-bazlı send rate limit penceresi — F1.1: "1 dakika sonra yeniden gönder". */
export const OTP_RATE_LIMIT_SEC = 60;
/** Brute-force eşiği — F1.1: "5 hatalı kod girişinden sonra 15 dakika kilit". */
export const OTP_MAX_ATTEMPTS = 5;
/** Kilit süresi (saniye) — F1.1: "15 dakika kilit". */
export const OTP_LOCKOUT_SEC = 900;

/** Redis key: telefonun aktif OTP kaydı (TTL `OTP_TTL_SEC`). */
export function otpSendKey(phoneE164: string): string {
  return `otp:send:${phoneE164}`;
}

/** Redis key: telefonun rate-limit kilidi (TTL `OTP_RATE_LIMIT_SEC`). */
export function otpRateKey(phoneE164: string): string {
  return `otp:rate:${phoneE164}`;
}

/** Redis key: aktif OTP'ye karşı yapılan hatalı verify sayacı (TTL `OTP_TTL_SEC`). */
export function otpAttemptsKey(phoneE164: string): string {
  return `otp:attempts:${phoneE164}`;
}

/** Redis key: brute-force kilidi (TTL `OTP_LOCKOUT_SEC`); varlığı = telefon kilitli. */
export function otpLockoutKey(phoneE164: string): string {
  return `otp:lockout:${phoneE164}`;
}

/**
 * `otp:send:<phone>` value şeması.
 *
 * Hatalı deneme sayacı kasten **burada tutulmaz** — ayrı `otp:attempts` key'inde
 * atomik INCR ile sayılır (JSON read-modify-write yarış koşulu yaratırdı).
 */
export interface OtpRecord {
  code: string;
}

/**
 * 6 haneli güvenli rastgele OTP üretir (100000–999999, dahil).
 *
 * `randomInt(min, max)` üst sınırı **dışlar**; 999999'u kapsamak için üst sınır
 * 1_000_000 verilir (task taslağındaki `999_999` off-by-one'ı düzeltir).
 */
export function generateOtp(): string {
  return randomInt(100_000, 1_000_000).toString();
}

/**
 * Telefon-bazlı send slot'u atomik olarak almaya çalışır (`SET NX EX 60`).
 *
 * @returns `true` slot alındıysa (gönderime devam); `false` zaten varsa (rate
 *   limit aktif → çağıran 429 döner). Concurrent isteklerde Redis NX tek
 *   kazananı garanti eder.
 */
export async function tryAcquireSendSlot(redis: Redis, phoneE164: string): Promise<boolean> {
  const res = await redis.set(otpRateKey(phoneE164), '1', 'EX', OTP_RATE_LIMIT_SEC, 'NX');
  return res === 'OK';
}

/** OTP kodunu `otp:send:<phone>` altında TTL ile saklar (mevcut kaydın üzerine yazar). */
export async function storeOtp(redis: Redis, phoneE164: string, code: string): Promise<void> {
  const record: OtpRecord = { code };
  await redis.set(otpSendKey(phoneE164), JSON.stringify(record), 'EX', OTP_TTL_SEC);
}

/**
 * Telefon brute-force kilidi altında mı? Kilitliyse kalan TTL'i (saniye) döner,
 * değilse `null`. Çağıran TTL'i `Retry-After` header'ında kullanır.
 */
export async function getLockoutTtl(redis: Redis, phoneE164: string): Promise<number | null> {
  const ttl = await redis.ttl(otpLockoutKey(phoneE164));
  // ioredis TTL: -2 key yok, -1 TTL yok (kilit her zaman TTL'li set edilir).
  return ttl > 0 ? ttl : null;
}

/**
 * Aktif OTP kaydını **tüketmeden** okur (verify karşılaştırması için).
 * Key yoksa/expire olduysa `null` (kod süresi dolmuş veya zaten tüketilmiş).
 */
export async function peekOtp(redis: Redis, phoneE164: string): Promise<OtpRecord | null> {
  const raw = await redis.get(otpSendKey(phoneE164));
  return raw === null ? null : (JSON.parse(raw) as OtpRecord);
}

/**
 * OTP kaydını **atomik** tüketir (`GETDEL`): değeri döndürür ve aynı anda siler.
 * Concurrent iki verify aynı doğru kodu denerse yalnızca biri kaydı alır, diğeri
 * `null` görür → ikinci istek "süresi doldu" döner (replay/race koruması).
 */
export async function consumeOtp(redis: Redis, phoneE164: string): Promise<OtpRecord | null> {
  const raw = await redis.getdel(otpSendKey(phoneE164));
  return raw === null ? null : (JSON.parse(raw) as OtpRecord);
}

/**
 * Hatalı denemeyi atomik kaydeder ve güncel sayacı döner. İlk denemede sayaca
 * OTP ile aynı TTL verilir (yeni `send` zaten key'i sıfırlar, kod-başına sayım).
 */
export async function registerFailedAttempt(redis: Redis, phoneE164: string): Promise<number> {
  const key = otpAttemptsKey(phoneE164);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, OTP_TTL_SEC);
  }
  return count;
}

/**
 * Telefonu 15dk kilitler ve aktif OTP + deneme sayacını temizler (kilit boyunca
 * eski kodla devam edilemez; kilit düşünce yeni `send` gerekir).
 */
export async function lockoutPhone(redis: Redis, phoneE164: string): Promise<void> {
  await redis.set(otpLockoutKey(phoneE164), '1', 'EX', OTP_LOCKOUT_SEC);
  await redis.del(otpSendKey(phoneE164), otpAttemptsKey(phoneE164));
}

/** Başarılı verify sonrası deneme sayacını siler (OTP kaydı `consumeOtp` ile zaten silindi). */
export async function clearAttempts(redis: Redis, phoneE164: string): Promise<void> {
  await redis.del(otpAttemptsKey(phoneE164));
}

/**
 * İki OTP kodunu sabit-zamanlı karşılaştırır (timing attack yüzeyini kapatır).
 * Uzunluklar farklıysa `timingSafeEqual` fırlatacağı için önce uzunluk elenir.
 */
export function codesMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
