/**
 * TASK-3.04 — BullMQ queue + worker smoke testleri.
 *
 * - notificationQueue: Redis'e bağlanıyor, Queue objesi oluşuyor
 * - Worker skeleton: başlatılıyor, sistem job işliyor (morning-reminder → completed)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { QueueEvents } from 'bullmq';

import { createPrismaClient, type PrismaClient } from './db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../test/db.js';
import { createBullMQConnection, createNotificationQueue } from './queue.js';
import { startNotificationWorker } from './workers/notification.worker.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://redis:6379';

describe('TASK-3.04 — BullMQ queue integration', () => {
  it('createNotificationQueue: Queue objesi oluşur, Redis bağlantısı kurulur', async () => {
    const queue = createNotificationQueue(REDIS_URL);
    // getJobCounts() Redis round-trip yapar — bağlantı doğrulanır
    const counts = await queue.getJobCounts();
    expect(counts).toBeDefined();
    await queue.close();
  });
});

describe('TASK-3.04 — Notification worker smoke', () => {
  let testDb: TestDatabase;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    prisma = createPrismaClient(testDb.databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    // Stale job ID'lerinin çakışmasını önlemek için queue'yu sıfırla
    const q = createNotificationQueue(REDIS_URL);
    await q.obliterate({ force: true });
    await q.close();

    await prisma.notificationLog.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.notificationLog.deleteMany();
  });

  it('Worker başlar, morning-reminder sistem job işler (üye yok → erken dönüş, log yok)', async () => {
    // TASK-3.08: morning-reminder artık sistem job'ı (userId almıyor).
    // DB'de eşleşen üye yok → sendMorningReminders erken döner → log yazılmaz → completed.
    const queue = createNotificationQueue(REDIS_URL);
    const queueEvents = new QueueEvents('notifications', { connection: createBullMQConnection(REDIS_URL) });
    const worker = startNotificationWorker(prisma, REDIS_URL);

    const job = await queue.add('morning-reminder', {});

    // QueueEvents aracılığıyla Redis pubsub üzerinden job tamamlanmasını bekle (race condition yok)
    await job.waitUntilFinished(queueEvents, 8_000);

    const logCount = await prisma.notificationLog.count();
    expect(logCount).toBe(0);

    await worker.close();
    await queueEvents.close();
    await queue.close();
  }, 20_000);
});
