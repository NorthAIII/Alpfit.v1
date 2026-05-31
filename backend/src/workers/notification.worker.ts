import { Worker } from 'bullmq';

import { createBullMQConnection, createNotificationQueue, type NotificationJobName } from '../queue.js';
import { isInSilentHours, msUntilTomorrowMorning } from '../lib/silent-hours.js';
import { ExpoPushAdapter } from '../lib/expo-push.js';
import { runNightlyStreakReset } from '../services/streak-reset.service.js';
import { sendMorningReminders, sendComebackT2 } from '../services/notification.service.js';

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
 * Sistem job'ları (userId yok): streak-reset-check, morning-reminder.
 * User-targeted job'lar (userId zorunlu): comeback-t2, comeback-t7-pt, t14-flag.
 */
export function startNotificationWorker(prisma: PrismaClient, redisUrl: string): Worker {
  // Job göndermek için dahili kuyruk (runNightlyStreakReset → comeback-t2)
  const internalQueue = createNotificationQueue(redisUrl);
  const expoAdapter = new ExpoPushAdapter(prisma);

  // 00:05 Istanbul — nightly streak sıfırlama repeatable job (idempotent kayıt)
  void internalQueue.add(
    'streak-reset-check',
    {},
    { repeat: { pattern: '5 0 * * *', tz: 'Europe/Istanbul' } },
  );

  // Her saat başı Istanbul — sabah reminder (morningHour eşleşen üyelere gönderir)
  void internalQueue.add(
    'morning-reminder',
    {},
    { repeat: { pattern: '0 * * * *', tz: 'Europe/Istanbul' } },
  );

  const worker = new Worker<NotificationJobData, void, NotificationJobName>(
    'notifications',
    async (job) => {
      // Sistem job'ları: userId yok, direkt çalıştır
      if (job.name === 'streak-reset-check') {
        await runNightlyStreakReset(prisma, internalQueue);
        return;
      }

      if (job.name === 'morning-reminder') {
        await sendMorningReminders(prisma, expoAdapter);
        return;
      }

      const userId = job.data.userId;
      if (!userId) return; // user-targeted job'da userId olmaması beklenmiyor

      switch (job.name) {
        case 'comeback-t2':
          await sendComebackT2(prisma, expoAdapter, internalQueue, userId);
          break;

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
