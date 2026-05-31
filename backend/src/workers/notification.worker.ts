import { Worker } from 'bullmq';

import { createBullMQConnection, type NotificationJobName } from '../queue.js';
import { isInSilentHours, msUntilTomorrowMorning } from '../lib/silent-hours.js';

import type { PrismaClient } from '../db/prisma.js';

export interface NotificationJobData {
  userId: string;
}

type NotificationStatus = 'sent' | 'failed' | 'skipped';

async function writeLog(
  prisma: PrismaClient,
  userId: string,
  jobType: string,
  status: NotificationStatus,
  meta?: Record<string, unknown>,
): Promise<void> {
  await prisma.notificationLog.create({
    data: { userId, jobType, status, meta: meta ?? null },
  });
}

/**
 * Notification worker'ı başlatır.
 *
 * Her job başında sessiz saat kontrolü yapar:
 *   - morning-reminder: sessiz saatteyse skip (geç hatırlatma kafa karıştırıcı)
 *   - comeback-t2: sessiz saatteyse ertesi 09:00'a yeniden zamanla
 *
 * Job handler'ları TASK-3.05–3.10'da doldurulacak.
 */
export function startNotificationWorker(prisma: PrismaClient, redisUrl: string): Worker {
  const worker = new Worker<NotificationJobData, void, NotificationJobName>(
    'notifications',
    async (job) => {
      const { userId } = job.data;

      switch (job.name) {
        case 'morning-reminder': {
          if (isInSilentHours()) {
            await writeLog(prisma, userId, job.name, 'skipped', { reason: 'silent-hours' });
            return;
          }
          // TASK-3.08'de implement edilecek
          await writeLog(prisma, userId, job.name, 'skipped', { reason: 'not-implemented' });
          break;
        }

        case 'comeback-t2': {
          if (isInSilentHours()) {
            // Ertesi 09:00'a delay ver — BullMQ job'u yeniden zamanla
            await job.moveToDelayed(Date.now() + msUntilTomorrowMorning(9));
            await writeLog(prisma, userId, job.name, 'skipped', { reason: 'silent-hours-delayed' });
            return;
          }
          // TASK-3.09'da implement edilecek
          await writeLog(prisma, userId, job.name, 'skipped', { reason: 'not-implemented' });
          break;
        }

        case 'comeback-t7-pt': {
          if (isInSilentHours()) {
            await job.moveToDelayed(Date.now() + msUntilTomorrowMorning(9));
            await writeLog(prisma, userId, job.name, 'skipped', { reason: 'silent-hours-delayed' });
            return;
          }
          // TASK-3.10'da implement edilecek
          await writeLog(prisma, userId, job.name, 'skipped', { reason: 'not-implemented' });
          break;
        }

        case 't14-flag': {
          // TASK-3.10'da implement edilecek
          await writeLog(prisma, userId, job.name, 'skipped', { reason: 'not-implemented' });
          break;
        }

        case 'streak-reset-check': {
          // TASK-3.05'te implement edilecek
          await writeLog(prisma, userId, job.name, 'skipped', { reason: 'not-implemented' });
          break;
        }
      }
    },
    { connection: createBullMQConnection(redisUrl) },
  );

  worker.on('failed', (job, err) => {
    // Worker crash → Fastify restart'ta onReady tekrar başlatır.
    // Hata log'da görünür; job dead queue'ya düşer (attempts tükendiyse).
    if (job) {
      void writeLog(prisma, job.data.userId, job.name, 'failed', {
        error: err.message,
      }).catch(() => {
        /* teardown sırasında DB erişilemez olabilir */
      });
    }
  });

  return worker;
}
