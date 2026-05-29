/**
 * OTP üretim + Redis depolama sözleşmesi (TASK-1.18).
 *
 * Güvenlik (QUALITY §2): kod `crypto.randomInt` ile üretilir — `Math.random`
 * KULLANILMAZ (tahmin edilebilir). Brute-force koruması (5 hatalı → 15dk kilit)
 * verify tarafında (TASK-1.19); burada yalnızca **send** + telefon-bazlı rate
 * limit var.
 */
import { randomInt } from 'node:crypto';

import type { Redis } from '../redis/client.js';

/** OTP kod geçerlilik süresi (saniye) — F1.1 PRD: "5 dakika geçerli". */
export const OTP_TTL_SEC = 300;
/** Telefon-bazlı send rate limit penceresi — F1.1: "1 dakika sonra yeniden gönder". */
export const OTP_RATE_LIMIT_SEC = 60;

/** Redis key: telefonun aktif OTP kaydı (TTL `OTP_TTL_SEC`). */
export function otpSendKey(phoneE164: string): string {
  return `otp:send:${phoneE164}`;
}

/** Redis key: telefonun rate-limit kilidi (TTL `OTP_RATE_LIMIT_SEC`). */
export function otpRateKey(phoneE164: string): string {
  return `otp:rate:${phoneE164}`;
}

/** `otp:send:<phone>` value şeması. `attempts` verify tarafında (TASK-1.19) artar. */
export interface OtpRecord {
  code: string;
  attempts: number;
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
  const record: OtpRecord = { code, attempts: 0 };
  await redis.set(otpSendKey(phoneE164), JSON.stringify(record), 'EX', OTP_TTL_SEC);
}
