/**
 * TASK-3.04 — ExpoPushAdapter unit testleri.
 *
 * expo-server-sdk HTTP çağrıları mock'lanır (fiziksel cihaz gerekmez).
 * invalid_token → PushToken silinmesi DB'de doğrulanır.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { ExpoPushAdapter } from './expo-push.js';

vi.mock('expo-server-sdk', () => {
  const mockSend = vi.fn();
  return {
    default: class MockExpo {
      sendPushNotificationsAsync = mockSend;
    },
    __mockSend: mockSend,
  };
});

async function getMockSend() {
  const mod = await import('expo-server-sdk');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).__mockSend as ReturnType<typeof vi.fn>;
}

describe('ExpoPushAdapter', () => {
  let testDb: TestDatabase;
  let prisma: PrismaClient;
  let adapter: ExpoPushAdapter;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    prisma = createPrismaClient(testDb.databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    await prisma.pushToken.deleteMany();
    await prisma.user.deleteMany();
    adapter = new ExpoPushAdapter(prisma);
  });

  async function createUserWithToken(token: string) {
    const user = await prisma.user.create({
      data: { phoneE164: '+905550000001', role: 'member', firstName: 'Test', lastName: 'Uye' },
    });
    await prisma.pushToken.create({ data: { userId: user.id, token, platform: 'ios' } });
    return user;
  }

  it('başarılı gönderimde "sent" döner', async () => {
    const mockSend = await getMockSend();
    mockSend.mockResolvedValueOnce([{ status: 'ok', id: 'receipt-123' }]);

    const result = await adapter.send({
      token: 'ExponentPushToken[test-token]',
      title: 'Başlık',
      body: 'Gövde',
    });

    expect(result).toBe('sent');
  });

  it('DeviceNotRegistered → "invalid_token" döner, PushToken silinir', async () => {
    const mockSend = await getMockSend();
    mockSend.mockResolvedValueOnce([
      {
        status: 'error',
        message: 'Device not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    ]);

    const token = 'ExponentPushToken[invalid-token]';
    await createUserWithToken(token);

    const result = await adapter.send({ token, title: 'T', body: 'B' });

    expect(result).toBe('invalid_token');
    const remaining = await prisma.pushToken.findFirst({ where: { token } });
    expect(remaining).toBeNull();
  });

  it('APNs/FCM geçici hatası → throw eder (BullMQ retry için)', async () => {
    const mockSend = await getMockSend();
    mockSend.mockResolvedValueOnce([
      {
        status: 'error',
        message: 'Message too big',
        details: { error: 'MessageTooBig' },
      },
    ]);

    await expect(
      adapter.send({ token: 'ExponentPushToken[t]', title: 'T', body: 'B' }),
    ).rejects.toThrow('Expo push error: MessageTooBig');
  });
});
