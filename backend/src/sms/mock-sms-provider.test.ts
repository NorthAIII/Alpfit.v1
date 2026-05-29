/**
 * TASK-1.17 — MockSmsProvider integration testleri.
 *
 * Doğrulanan senaryolar:
 *   1. sendOtp → dev_otp_log row'u oluşur (code plaintext, DB'de redact YOK)
 *   2. providerMessageId `mock-` ile başlar
 *   3. pino log satırında PII (phoneE164 + otpCode) `[REDACTED]` — PII_FIELDS +
 *      getPinoRedactPaths() doğru çalışıyor (Sentry/log sızıntısı önleme).
 */
import { getPinoRedactPaths } from '@alpfit/shared';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';

import { MockSmsProvider } from './mock-sms-provider.js';

import { createSmsProvider } from './index.js';

import type { FastifyBaseLogger } from 'fastify';

const PHONE = '+905551234567';
const CODE = '123456';
const TTL = 300;

/** PII redact'li pino logger + yakaladığı JSON satırları döndürür. */
function makeCapturingLogger(): { logger: FastifyBaseLogger; lines: string[] } {
  const lines: string[] = [];
  const logger = pino(
    { level: 'info', redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' } },
    { write: (chunk: string) => lines.push(chunk) },
  );
  return { logger: logger as unknown as FastifyBaseLogger, lines };
}

describe('TASK-1.17 — MockSmsProvider', () => {
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
    await prisma.devOtpLog.deleteMany();
  });

  it('sendOtp writes a dev_otp_log row with plaintext code + returns mock id', async () => {
    const { logger } = makeCapturingLogger();
    const provider = new MockSmsProvider({ prisma, logger });

    const result = await provider.sendOtp(PHONE, CODE, TTL);

    expect(result.providerMessageId).toMatch(/^mock-/);

    const rows = await prisma.devOtpLog.findMany({ where: { phoneE164: PHONE } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.code).toBe(CODE); // DB'de plaintext (dev lookup buradan okur)
    expect(rows[0]?.ttlSec).toBe(TTL);
    expect(rows[0]?.consumedAt).toBeNull();
  });

  it('log line redacts phone + otp code via PII_FIELDS', async () => {
    const { logger, lines } = makeCapturingLogger();
    const provider = new MockSmsProvider({ prisma, logger });

    await provider.sendOtp(PHONE, CODE, TTL);

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    expect(entry['phoneE164']).toBe('[REDACTED]');
    expect(entry['otpCode']).toBe('[REDACTED]');
    // ttlSec PII değil → açık kalır (redact yalnızca PII alanlarına)
    expect(entry['ttlSec']).toBe(TTL);
    // Ham OTP kodu log satırının hiçbir yerinde plaintext görünmemeli.
    expect(lines[0]).not.toContain(CODE);
    expect(lines[0]).not.toContain(PHONE);
  });
});

describe('TASK-1.17 — createSmsProvider factory', () => {
  const { logger } = makeCapturingLogger();
  // Factory `mock` yolunda DB'ye dokunmaz (sadece construct eder); boş stub yeter.
  const deps = { prisma: {} as PrismaClient, logger };

  it('returns a MockSmsProvider when SMS_PROVIDER=mock', () => {
    const provider = createSmsProvider({ SMS_PROVIDER: 'mock' }, deps);
    expect(provider).toBeInstanceOf(MockSmsProvider);
  });

  it('throws for SMS_PROVIDER=live (Yakın 5, not implemented)', () => {
    expect(() => createSmsProvider({ SMS_PROVIDER: 'live' }, deps)).toThrow(
      /Live SMS provider not implemented/,
    );
  });
});
