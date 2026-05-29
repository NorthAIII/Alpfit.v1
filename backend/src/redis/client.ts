/**
 * Redis bağlantı katmanı (TASK-1.18).
 *
 * OTP gönderim akışı Redis'i iki amaçla kullanır:
 *   - OTP kodu kısa-ömürlü saklama (`otp:send:<phoneE164>`, TTL 300sn) — TTL
 *     otomatik temizler, ayrı purge job gerekmez.
 *   - Telefon-bazlı rate limit (`otp:rate:<phoneE164>`, `SET NX EX 60`) — aynı
 *     telefon için dakikada 1 send (atomik; concurrent isteklerde tek kazanan).
 *
 * Kalıcı tarihsel kayıt Redis'te DEĞİL: dev OTP log (`dev_otp_log`, TASK-1.17)
 * ve KVKK audit log (`audit_log`, TASK-1.14) tarafında tutulur.
 *
 * Lifecycle: `db/prisma.ts` ile aynı desen — `createRedisClient` her çağrıda
 * yeni instance üretir (test'ler kendi izole client'ını enjekte eder),
 * `getRedis` ise production için tek paylaşımlı instance tutar. Server
 * `opts.redis ?? getRedis(env.REDIS_URL)` ile çözer.
 */
import { Redis, type RedisOptions } from 'ioredis';

export type { Redis };

/**
 * Yeni bir ioredis instance üretir.
 *
 * @param url     `REDIS_URL` (örn. `redis://redis:6379`).
 * @param options ioredis override'ları (test izolasyonu için `keyPrefix`,
 *                healthz down senaryosu için fail-fast ayarları vb.).
 */
export function createRedisClient(url: string, options?: RedisOptions): Redis {
  return new Redis(url, {
    // Redis erişilemezse istek sonsuza kadar kuyruğa girmesin — healthz ping'i
    // ve OTP yazımları sınırlı denemeden sonra reddedilir (graceful degradation).
    maxRetriesPerRequest: 3,
    ...options,
  });
}

const globalForRedis = globalThis as unknown as {
  __alpfitRedis?: Redis;
};

/** Production paylaşımlı (process-ömürlü) Redis instance'ı. */
export function getRedis(url: string): Redis {
  if (!globalForRedis.__alpfitRedis) {
    globalForRedis.__alpfitRedis = createRedisClient(url);
  }
  return globalForRedis.__alpfitRedis;
}

/** `/healthz` için Redis erişilebilirlik kontrolü. Hata yutulur → `false`. */
export async function pingRedis(redis: Redis): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}
