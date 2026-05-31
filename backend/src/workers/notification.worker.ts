import { Worker } from 'bullmq';

import { createBullMQConnection, createNotificationQueue, type NotificationJobName } from '../queue.js';
import { isInSilentHours, msUntilTomorrowMorning } from '../lib/silent-hours.js';
import { runNightlyStreakReset } from '../services/streak-reset.service.js';

import type { PrismaClient } from '../db/prisma.js';

// userId: user-targeted job'lar için zorunlu; streak-reset-check sistem job'ı için undefined.
export interface NotificationJobData {
  userId?: string;
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
 * streak-reset-check: Her gün 00:05 Istanbul repeatable job — runNightlyStreakReset çağırır.
 * User-targeted job'lar (morning-reminder, comeback-t2, vb.): sessiz saat kontrolü + NotificationLog.
 */
export function startNotificationWorker(prisma: PrismaClient, redisUrl: string): Worker {
  // Job göndermek için dahili kuyruk (runNightlyStreakReset → comeback-t2, TASK-3.08 → morning-reminder)
  const internalQueue = createNotificationQueue(redisUrl);

  // 00:05 Istanbul — nightly streak sıfırlama repeatable job (idempotent kayıt)
  void internalQueue.add(
    'streak-reset-check',
    {},
    { repeat: { pattern: '5 0 * * *', tz: 'Europe/Istanbul' } },
  );

  const worker = new Worker<NotificationJobData, void, NotificationJobName>(
    'notifications',
    async (job) => {
      // Sistem job'ı: userId yok, direkt çalıştır
      if (job.name === 'streak-reset-check') {
        await runNightlyStreakReset(prisma, internalQueue);
        return;
      }

      const userId = job.data.userId;
      if (!userId) return; // user-targeted job'da userId olmaması beklenmiyor

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
      }
    },
    { connection: createBullMQConnection(redisUrl) },
  );

  worker.on('failed', (job, err) => {
    // streak-reset-check sistem job'ı için userId yok — NotificationLog yazılmaz
    if (job?.data.userId) {
      void writeLog(prisma, job.data.userId, job.name, 'failed', {
        error: err.message,
      }).catch(() => {
        /* teardown sırasında DB erişilemez olabilir */
      });
    }
  });

  return worker;
}
