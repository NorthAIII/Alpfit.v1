import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export type NotificationJobName =
  | 'morning-reminder'
  | 'comeback-t2'
  | 'comeback-t7-pt'
  | 't14-flag'
  | 'streak-reset-check';

/**
 * BullMQ için izole ioredis bağlantısı.
 *
 * BullMQ, mevcut ioredis client'ını paylaşamaz: Worker blocking komutlar
 * (BLPOP) kullandığından ayrı connection gerekir; `maxRetriesPerRequest: null`
 * ve `enableReadyCheck: false` BullMQ'nun zorunlu tuttuğu ayarlardır.
 */
export function createBullMQConnection(redisUrl: string): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

/**
 * Bildirim job kuyruğu. TASK-3.05–3.10 job implementasyonları buraya
 * `notificationQueue.add(...)` ile iş ekler.
 */
export function createNotificationQueue(redisUrl: string): Queue {
  return new Queue('notifications', {
    connection: createBullMQConnection(redisUrl),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5 * 60 * 1000 },
    },
  });
}
