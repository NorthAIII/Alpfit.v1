/**
 * TASK-1.14 — AuditLog PII koruması ve hash davranışı testleri.
 *
 * Risk-mitigation kanıtı: helper `logAuditEvent()` dışında doğrudan
 * `prisma.auditLog.create(...)` yasak (DECISIONS); zod whitelist PII alanını
 * runtime'da reddeder.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { AuditEventType } from '../generated/prisma/enums.js';
import { hashUserId } from '../observability/pii-scrubber.js';

import { AuditMetadataSchema, logAuditEvent } from './audit.js';

describe('TASK-1.14 — AuditLog (KVKK denetim event log)', () => {
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
    await prisma.auditLog.deleteMany();
  });

  describe('zod whitelist — PII reddetme', () => {
    it('`phone` alanı (PII) içeren metadata reddedilir', async () => {
      await expect(
        logAuditEvent(prisma, {
          userId: 'user_abc',
          eventType: AuditEventType.user_login,
          // @ts-expect-error — whitelist dışı; zod runtime'da reddetmeli.
          metadata: { phone: '+905551234567', deviceType: 'ios' },
        }),
      ).rejects.toBeInstanceOf(ZodError);

      // DB'ye hiçbir row yazılmamış olmalı
      expect(await prisma.auditLog.count()).toBe(0);
    });

    it('`weight` (sağlık verisi) içeren metadata reddedilir', async () => {
      await expect(
        logAuditEvent(prisma, {
          userId: 'user_def',
          eventType: AuditEventType.user_login,
          // @ts-expect-error — whitelist dışı.
          metadata: { weight: 75.5, ip: '1.2.3.4' },
        }),
      ).rejects.toBeInstanceOf(ZodError);

      expect(await prisma.auditLog.count()).toBe(0);
    });

    it('`firstName` / `email` (kimlik PII) içeren metadata reddedilir', async () => {
      await expect(AuditMetadataSchema.parseAsync({ firstName: 'Ayşe' })).rejects.toBeInstanceOf(
        ZodError,
      );
      await expect(AuditMetadataSchema.parseAsync({ email: 'a@b.com' })).rejects.toBeInstanceOf(
        ZodError,
      );
    });
  });

  describe('whitelist içi alanlar kabul edilir', () => {
    it('`ip` + `deviceType` içeren metadata kabul edilir ve yazılır', async () => {
      const result = await logAuditEvent(prisma, {
        userId: 'user_login_1',
        eventType: AuditEventType.user_login,
        metadata: { ip: '1.2.3.4', deviceType: 'ios' },
      });

      expect(result.id).toBeTruthy();

      const row = await prisma.auditLog.findUnique({ where: { id: result.id } });
      expect(row).not.toBeNull();
      expect(row?.eventType).toBe(AuditEventType.user_login);
      expect(row?.metadata).toEqual({ ip: '1.2.3.4', deviceType: 'ios' });
    });

    it('metadata atlanırsa null olarak yazılır', async () => {
      const result = await logAuditEvent(prisma, {
        userId: 'user_logout_1',
        eventType: AuditEventType.user_logout,
      });

      const row = await prisma.auditLog.findUnique({ where: { id: result.id } });
      expect(row?.metadata).toBeNull();
    });

    it('consent event whitelist alanları (`consentType`, `textVersion`) kabul edilir', async () => {
      const result = await logAuditEvent(prisma, {
        userId: 'user_consent_1',
        eventType: AuditEventType.consent_granted,
        metadata: { consentType: 'kvkk_aydinlatma', textVersion: 'v2026-05-29' },
      });

      const row = await prisma.auditLog.findUnique({ where: { id: result.id } });
      expect(row?.metadata).toEqual({
        consentType: 'kvkk_aydinlatma',
        textVersion: 'v2026-05-29',
      });
    });
  });

  describe('userId hash uygulaması', () => {
    it('DB row `userIdHash`, ham `userId`den farklı (sha256 prefix 12 hex)', async () => {
      const rawUserId = 'user_hash_test_1';
      const expectedHash = hashUserId(rawUserId);

      const result = await logAuditEvent(prisma, {
        userId: rawUserId,
        eventType: AuditEventType.otp_verified,
      });

      expect(result.userIdHash).toBe(expectedHash);
      expect(result.userIdHash).not.toBe(rawUserId);
      expect(result.userIdHash).toMatch(/^[a-f0-9]{12}$/);

      const row = await prisma.auditLog.findUnique({ where: { id: result.id } });
      expect(row?.userIdHash).toBe(expectedHash);
      // Negatif kanıt: row'da ham user ID yok — tablo şeması zaten userId
      // alanına sahip değil, ama metadata içinde de görünmüyor.
      expect(JSON.stringify(row)).not.toContain(rawUserId);
    });

    it('aynı `userId` farklı çağrılarda aynı hash üretir (correlation için)', async () => {
      const userId = 'user_corr_1';
      const a = await logAuditEvent(prisma, { userId, eventType: AuditEventType.user_login });
      const b = await logAuditEvent(prisma, { userId, eventType: AuditEventType.user_logout });
      expect(a.userIdHash).toBe(b.userIdHash);
    });
  });
});
