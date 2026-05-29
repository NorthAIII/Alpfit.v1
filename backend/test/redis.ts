import { randomBytes } from 'node:crypto';

import { createRedisClient, type Redis } from '../src/redis/client.js';

// Per-suite Redis izolasyonu: db.ts'in per-suite Postgres deseninin Redis
// karşılığı. Testcontainers KULLANILMAZ (Docker daemon gerektirir — DECISIONS.md
// "Backend Test Isolation"); devcontainer'daki gerçek Redis 7 servisine
// (`REDIS_URL`) bağlanır ve her suite kendi rastgele `keyPrefix`'ini alır.
// Böylece paralel suite'ler birbirinin anahtarlarını görmez; artık anahtarlar
// TTL ile (OTP 300sn, rate 60sn) zaten kendiliğinden temizlenir, teardown
// yalnızca bağlantıyı kapatır.

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://redis:6379';

export interface TestRedis {
  redis: Redis;
  keyPrefix: string;
  cleanup: () => Promise<void>;
}

/**
 * İzole bir test Redis client'ı üretir. `keyPrefix` ioredis tarafından tüm
 * komutlara otomatik eklenir; route ve test aynı client'ı kullandığından
 * (enjekte edilir) prefix tek sefer uygulanır, çift-prefix tuzağı oluşmaz.
 */
export function createTestRedis(): TestRedis {
  const keyPrefix = `test:${randomBytes(6).toString('hex')}:`;
  const redis = createRedisClient(REDIS_URL, { keyPrefix });
  return {
    redis,
    keyPrefix,
    cleanup: async () => {
      await redis.quit().catch(() => {
        // Bağlantı zaten kapalı/erişilemez olabilir; teardown gürültüsü test
        // sonucunu etkilemesin.
      });
    },
  };
}
