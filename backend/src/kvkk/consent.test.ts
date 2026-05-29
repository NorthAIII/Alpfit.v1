/**
 * TASK-1.14 — ConsentRecord append-only event log testleri.
 *
 * Doğrulanan senaryolar:
 *  1. granted event yazar → getActiveConsent true
 *  2. granted → revoked → getActiveConsent false (append-only)
 *  3. revoked sonrası eski granted event hala DB'de (history korunur)
 *  4. User.kvkkConsentAt / healthConsentAt denormalized cache senkron
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { ConsentEventType, ConsentType, Role } from '../generated/prisma/enums.js';

import { getActiveConsent, recordConsent } from './consent.js';

describe('TASK-1.14 — ConsentRecord (versiyonlu, append-only)', () => {
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
    await prisma.consentRecord.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createMember(phone: string): Promise<{ id: string }> {
    return prisma.user.create({
      data: {
        phoneE164: phone,
        role: Role.member,
        firstName: 'Üye',
        lastName: 'Test',
      },
      select: { id: true },
    });
  }

  it('recordConsent granted event yazar; getActiveConsent true döner', async () => {
    const user = await createMember('+905551110001');

    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.kvkk_aydinlatma,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
      ipAddress: '1.2.3.4',
      userAgent: 'Alpfit/1.0 (ios)',
    });

    const isActive = await getActiveConsent(prisma, user.id, ConsentType.kvkk_aydinlatma);
    expect(isActive).toBe(true);

    const rows = await prisma.consentRecord.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventType).toBe(ConsentEventType.granted);
    expect(rows[0]?.textVersion).toBe('v2026-05-29');
    expect(rows[0]?.ipAddress).toBe('1.2.3.4');
    expect(rows[0]?.userAgent).toBe('Alpfit/1.0 (ios)');
  });

  it('revoked event sonrası getActiveConsent false; eski granted event korunur (append-only)', async () => {
    const user = await createMember('+905551110002');

    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.saglik_verisi,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
    });

    expect(await getActiveConsent(prisma, user.id, ConsentType.saglik_verisi)).toBe(true);

    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.saglik_verisi,
      eventType: ConsentEventType.revoked,
      textVersion: 'v2026-05-29',
    });

    expect(await getActiveConsent(prisma, user.id, ConsentType.saglik_verisi)).toBe(false);

    // Append-only: hem granted hem revoked event hala DB'de
    const rows = await prisma.consentRecord.findMany({
      where: { userId: user.id, consentType: ConsentType.saglik_verisi },
      orderBy: { occurredAt: 'asc' },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.eventType).toBe(ConsentEventType.granted);
    expect(rows[1]?.eventType).toBe(ConsentEventType.revoked);
  });

  it('User.kvkkConsentAt / healthConsentAt denormalized cache rıza değişiminde senkron', async () => {
    const user = await createMember('+905551110003');

    // Başta cache null
    const before = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kvkkConsentAt: true, healthConsentAt: true },
    });
    expect(before?.kvkkConsentAt).toBeNull();
    expect(before?.healthConsentAt).toBeNull();

    // KVKK aydınlatma granted → User.kvkkConsentAt set
    const kvkkRecord = await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.kvkk_aydinlatma,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
    });
    // Sağlık verisi granted → User.healthConsentAt set
    const healthRecord = await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.saglik_verisi,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
    });

    const afterGrant = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kvkkConsentAt: true, healthConsentAt: true },
    });
    expect(afterGrant?.kvkkConsentAt?.getTime()).toBe(kvkkRecord.occurredAt.getTime());
    expect(afterGrant?.healthConsentAt?.getTime()).toBe(healthRecord.occurredAt.getTime());

    // Sağlık rızası revoked → healthConsentAt null, kvkkConsentAt bozulmaz
    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.saglik_verisi,
      eventType: ConsentEventType.revoked,
      textVersion: 'v2026-05-29',
    });

    const afterRevoke = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kvkkConsentAt: true, healthConsentAt: true },
    });
    expect(afterRevoke?.healthConsentAt).toBeNull();
    expect(afterRevoke?.kvkkConsentAt?.getTime()).toBe(kvkkRecord.occurredAt.getTime());

    // auto_revoked event de cache'i null'a çeker (TASK-1.15 retention job için)
    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.kvkk_aydinlatma,
      eventType: ConsentEventType.auto_revoked,
      textVersion: 'v2026-05-29',
    });
    const afterAuto = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kvkkConsentAt: true },
    });
    expect(afterAuto?.kvkkConsentAt).toBeNull();
  });

  it('pazarlama_iletisim consent User cache alanlarına dokunmaz (v1 alan yok)', async () => {
    const user = await createMember('+905551110004');

    await recordConsent(prisma, {
      userId: user.id,
      consentType: ConsentType.pazarlama_iletisim,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
    });

    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kvkkConsentAt: true, healthConsentAt: true },
    });
    expect(after?.kvkkConsentAt).toBeNull();
    expect(after?.healthConsentAt).toBeNull();

    // Yine de getActiveConsent doğru cevap verir (truth source ConsentRecord)
    expect(await getActiveConsent(prisma, user.id, ConsentType.pazarlama_iletisim)).toBe(true);
  });
});
