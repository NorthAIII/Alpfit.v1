/**
 * TASK-3.04 — BullMQ queue + worker smoke testleri.
 *
 * - notificationQueue: Redis'e bağlanıyor, Queue objesi oluşuyor
 * - Worker skeleton: başlatılıyor, job işliyor, NotificationLog yazıyor
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createPrismaClient, type PrismaClient } from './db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../test/db.js';
import { createNotificationQueue } from './queue.js';
import { startNotificationWorker } from './workers/notification.worker.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://redis:6379';

/** Job tamamlanana kadar polling ile bekle (maks `timeoutMs`). */
async function waitForLog(
  prisma: PrismaClient,
  userId: string,
  jobType: string,
  timeoutMs = 8_000,
): Promise<{ status: string } | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const log = await prisma.notificationLog.findFirst({ where: { userId, jobType } });
    if (log) return log;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

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
    await prisma.notificationLog.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.notificationLog.deleteMany();
  });

  it('Worker başlar, morning-reminder job işler, NotificationLog yazar', async () => {
    const user = await prisma.user.create({
      data: { phoneE164: '+905550000099', role: 'member', firstName: 'W', lastName: 'Test' },
    });

    const queue = createNotificationQueue(REDIS_URL);
    const worker = startNotificationWorker(prisma, REDIS_URL);

    await queue.add('morning-reminder', { userId: user.id });

    const log = await waitForLog(prisma, user.id, 'morning-reminder');
    expect(log).not.toBeNull();
    expect(log?.status).toBe('skipped');

    await worker.close();
    await queue.close();
  }, 20_000);
});
