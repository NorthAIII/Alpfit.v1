/**
 * TASK-1.15 — Soft delete + 30 gün retention purge integration testleri.
 *
 * Doğrulanan senaryolar:
 *   1. softDeleteUser → deletedAt + retentionDeadline = now + 30g + AuditLog member_removed
 *   2. endTrainerMember → relation.endedAt + member.retentionDeadline + AuditLog
 *   3. revokeHealthConsent → ConsentRecord revoked + cache null + retention + AuditLog
 *   4. runRetentionPurge — deadline geçmemiş user purge etmez
 *   5. runRetentionPurge — deadline geçmiş + deletedAt set → anonimize + AuditLog retention_purge
 *   6. runRetentionPurge — deadline geçmiş + deletedAt null → sadece deadline reset (sağlık-purge yolu)
 *   7. v1.5-ready: sağlık verisi tablosu yok → purge job 0 satır siler, hata fırlatmaz
 *   8. idempotent: ardışık iki çalıştırmada aynı user tekrar işlenmez
 *   9. Endpoint POST /admin/internal/retention-purge — bearer auth, 200/401/503
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { loadEnv } from '../config/env.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { AuditEventType, ConsentEventType, ConsentType, Role } from '../generated/prisma/enums.js';
import { hashUserId } from '../observability/pii-scrubber.js';
import { buildServer } from '../server.js';

import { recordConsent } from './consent.js';
import { runRetentionPurge } from './retention-job.js';
import {
  endTrainerMember,
  RETENTION_DAYS,
  revokeHealthConsent,
  softDeleteUser,
} from './soft-delete.js';

import type { FastifyInstance } from 'fastify';

const ADMIN_TOKEN = 'integration-test-admin-token-0123456789ab';
const PT_PHONE = '+905551210001';
const MEMBER_PHONE_BASE = '+90555122';

function plusDaysFromNow(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

describe('TASK-1.15 — Soft delete helpers', () => {
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
    await prisma.consentRecord.deleteMany();
    await prisma.trainerMember.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createMember(phone: string): Promise<{ id: string }> {
    return prisma.user.create({
      data: { phoneE164: phone, role: Role.member, firstName: 'Üye', lastName: 'Test' },
      select: { id: true },
    });
  }

  async function createTrainer(phone: string): Promise<{ id: string }> {
    return prisma.user.create({
      data: { phoneE164: phone, role: Role.trainer, firstName: 'PT', lastName: 'Test' },
      select: { id: true },
    });
  }

  it('softDeleteUser sets deletedAt + retentionDeadline=now+30d + AuditLog member_removed', async () => {
    const member = await createMember(`${MEMBER_PHONE_BASE}0001`);
    const before = new Date();

    const result = await softDeleteUser(prisma, { userId: member.id, reason: 'self_delete' });

    expect(result.deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    const expectedDeadline = plusDaysFromNow(RETENTION_DAYS, result.deletedAt);
    expect(Math.abs(result.retentionDeadline.getTime() - expectedDeadline.getTime())).toBeLessThan(
      1000,
    );

    const fresh = await prisma.user.findUnique({
      where: { id: member.id },
      select: { deletedAt: true, retentionDeadline: true },
    });
    expect(fresh?.deletedAt?.getTime()).toBe(result.deletedAt.getTime());
    expect(fresh?.retentionDeadline?.getTime()).toBe(result.retentionDeadline.getTime());

    const audit = await prisma.auditLog.findFirst({
      where: { eventType: AuditEventType.member_removed },
    });
    expect(audit?.userIdHash).toBe(hashUserId(member.id));
    expect(audit?.metadata).toEqual({ reason: 'self_delete' });
  });

  it('endTrainerMember closes the relation + sets member retention + AuditLog', async () => {
    const member = await createMember(`${MEMBER_PHONE_BASE}0002`);
    const trainer = await createTrainer(PT_PHONE);
    const relation = await prisma.trainerMember.create({
      data: { trainerId: trainer.id, memberId: member.id },
      select: { id: true },
    });

    const result = await endTrainerMember(prisma, {
      relationId: relation.id,
      reason: 'pt_removed',
    });

    expect(result.memberId).toBe(member.id);
    expect(result.endedAt).toBeInstanceOf(Date);

    const freshRelation = await prisma.trainerMember.findUnique({ where: { id: relation.id } });
    expect(freshRelation?.endedAt?.getTime()).toBe(result.endedAt.getTime());

    const freshMember = await prisma.user.findUnique({
      where: { id: member.id },
      select: { retentionDeadline: true, deletedAt: true },
    });
    expect(freshMember?.deletedAt).toBeNull(); // hesap kalır (sadece sağlık verisi purge)
    expect(freshMember?.retentionDeadline?.getTime()).toBe(result.retentionDeadline.getTime());

    const audit = await prisma.auditLog.findFirst({
      where: { eventType: AuditEventType.member_removed },
    });
    expect(audit?.userIdHash).toBe(hashUserId(member.id));
    expect(audit?.metadata).toEqual({ reason: 'pt_removed' });
  });

  it('revokeHealthConsent writes revoked event + nulls cache + retention + AuditLog', async () => {
    const member = await createMember(`${MEMBER_PHONE_BASE}0003`);

    // Önce sağlık rızası verilmiş olsun (geri çekme için ön koşul).
    await recordConsent(prisma, {
      userId: member.id,
      consentType: ConsentType.saglik_verisi,
      eventType: ConsentEventType.granted,
      textVersion: 'v2026-05-29',
    });

    const before = await prisma.user.findUnique({
      where: { id: member.id },
      select: { healthConsentAt: true },
    });
    expect(before?.healthConsentAt).not.toBeNull();

    const result = await revokeHealthConsent(prisma, {
      userId: member.id,
      textVersion: 'v2026-05-29',
      ipAddress: '1.2.3.4',
      userAgent: 'Alpfit/1.0 (ios)',
    });

    // Cache null + retention deadline set
    const after = await prisma.user.findUnique({
      where: { id: member.id },
      select: { healthConsentAt: true, retentionDeadline: true, deletedAt: true },
    });
    expect(after?.healthConsentAt).toBeNull();
    expect(after?.deletedAt).toBeNull();
    expect(after?.retentionDeadline?.getTime()).toBe(result.retentionDeadline.getTime());

    // Append-only: revoked event yazıldı, granted event hala duruyor
    const events = await prisma.consentRecord.findMany({
      where: { userId: member.id, consentType: ConsentType.saglik_verisi },
      orderBy: { occurredAt: 'asc' },
    });
    expect(events.map((e) => e.eventType)).toEqual([
      ConsentEventType.granted,
      ConsentEventType.revoked,
    ]);
    expect(events[1]?.ipAddress).toBe('1.2.3.4');
    expect(events[1]?.userAgent).toBe('Alpfit/1.0 (ios)');

    const audit = await prisma.auditLog.findFirst({
      where: { eventType: AuditEventType.consent_revoked },
    });
    expect(audit?.userIdHash).toBe(hashUserId(member.id));
    expect(audit?.metadata).toEqual({
      consentType: ConsentType.saglik_verisi,
      textVersion: 'v2026-05-29',
    });
  });
});

describe('TASK-1.15 — runRetentionPurge', () => {
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
    await prisma.consentRecord.deleteMany();
    await prisma.trainerMember.deleteMany();
    await prisma.user.deleteMany();
  });

  it('deadline geçmemiş user purge etmez', async () => {
    const future = plusDaysFromNow(5);
    const member = await prisma.user.create({
      data: {
        phoneE164: `${MEMBER_PHONE_BASE}1001`,
        role: Role.member,
        firstName: 'Aktif',
        lastName: 'Üye',
        deletedAt: new Date(),
        retentionDeadline: future,
      },
      select: { id: true },
    });

    const report = await runRetentionPurge(prisma);
    expect(report.processedCount).toBe(0);

    const fresh = await prisma.user.findUnique({
      where: { id: member.id },
      select: { firstName: true, retentionDeadline: true },
    });
    expect(fresh?.firstName).toBe('Aktif');
    expect(fresh?.retentionDeadline?.getTime()).toBe(future.getTime());
  });

  it('deadline geçmiş + deletedAt set → user anonimize, AuditLog retention_purge yazılır', async () => {
    const past = plusDaysFromNow(-1);
    const member = await prisma.user.create({
      data: {
        phoneE164: `${MEMBER_PHONE_BASE}1002`,
        role: Role.member,
        firstName: 'Eski',
        lastName: 'Üye',
        profilePhotoUrl: 'https://cdn/old.jpg',
        deletedAt: plusDaysFromNow(-RETENTION_DAYS - 1),
        retentionDeadline: past,
      },
      select: { id: true },
    });

    const report = await runRetentionPurge(prisma);
    expect(report.processedCount).toBe(1);
    expect(report.anonymizedCount).toBe(1);
    expect(report.healthDataPurgedCount).toBe(0);
    expect(report.deletedHealthRowsCount).toBe(0);

    const anon = await prisma.user.findUnique({
      where: { id: member.id },
      select: {
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        phoneE164: true,
        retentionDeadline: true,
        deletedAt: true,
      },
    });
    expect(anon?.firstName).toBe('');
    expect(anon?.lastName).toBe('');
    expect(anon?.profilePhotoUrl).toBeNull();
    expect(anon?.phoneE164).toMatch(/^deleted_[a-f0-9]{12}$/);
    expect(anon?.retentionDeadline).toBeNull();
    expect(anon?.deletedAt).not.toBeNull(); // soft-delete kaydı kalır (denetim için)

    const audit = await prisma.auditLog.findFirst({
      where: { eventType: AuditEventType.retention_purge },
    });
    expect(audit).not.toBeNull();
    expect(audit?.metadata).toMatchObject({ count: 1 });
    expect((audit?.metadata as { reason: string }).reason).toMatch(/anonymized=1/);
  });

  it('deadline geçmiş + deletedAt null → hesap kalır, sadece deadline null reset', async () => {
    const past = plusDaysFromNow(-1);
    const member = await prisma.user.create({
      data: {
        phoneE164: `${MEMBER_PHONE_BASE}1003`,
        role: Role.member,
        firstName: 'Hasta',
        lastName: 'Rıza',
        retentionDeadline: past,
        deletedAt: null,
      },
      select: { id: true },
    });

    const report = await runRetentionPurge(prisma);
    expect(report.processedCount).toBe(1);
    expect(report.anonymizedCount).toBe(0);
    expect(report.healthDataPurgedCount).toBe(1);

    const fresh = await prisma.user.findUnique({
      where: { id: member.id },
      select: { firstName: true, phoneE164: true, retentionDeadline: true, deletedAt: true },
    });
    expect(fresh?.firstName).toBe('Hasta'); // PII silinmedi, hesap aktif
    expect(fresh?.phoneE164).toBe(`${MEMBER_PHONE_BASE}1003`);
    expect(fresh?.deletedAt).toBeNull();
    expect(fresh?.retentionDeadline).toBeNull(); // cycle complete
  });

  it('v1: sağlık verisi tablosu yokken purge job 0 satır siler ve hata fırlatmaz', async () => {
    // Hiç purge candidate yok — sağlık tablosu da yok. Smoke garantisi.
    const report = await runRetentionPurge(prisma);
    expect(report.processedCount).toBe(0);
    expect(report.deletedHealthRowsCount).toBe(0);

    // AuditLog `retention_purge` count=0 ile yine yazılır (şeffaflık).
    const audit = await prisma.auditLog.findFirst({
      where: { eventType: AuditEventType.retention_purge },
    });
    expect(audit?.metadata).toMatchObject({ count: 0 });
  });

  it('idempotent — aynı user ardışık çalıştırmada tekrar işlenmez', async () => {
    const past = plusDaysFromNow(-1);
    await prisma.user.create({
      data: {
        phoneE164: `${MEMBER_PHONE_BASE}1004`,
        role: Role.member,
        firstName: 'İdem',
        lastName: 'Potent',
        deletedAt: plusDaysFromNow(-RETENTION_DAYS - 1),
        retentionDeadline: past,
      },
    });

    const first = await runRetentionPurge(prisma);
    expect(first.anonymizedCount).toBe(1);

    const second = await runRetentionPurge(prisma);
    expect(second.processedCount).toBe(0);
  });
});

describe('TASK-1.15 — POST /admin/internal/retention-purge', () => {
  let testDb: TestDatabase;
  let server: TestServer;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    server = await buildTestServer({ databaseUrl: testDb.databaseUrl });
  });

  afterAll(async () => {
    await server.app.close();
    await server.prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  it('503 unconfigured — ADMIN_INTERNAL_TOKEN env eksik', async () => {
    // buildTestServer ADMIN_INTERNAL_TOKEN olmadan loadEnv'i çağırıyor →
    // env field optional ve undefined; endpoint 503 dönmeli.
    const res = await server.app.inject({
      method: 'POST',
      url: '/admin/internal/retention-purge',
      headers: { authorization: 'Bearer anything' },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'unconfigured' });
  });
});

describe('TASK-1.15 — POST /admin/internal/retention-purge — token configured', () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    const env = loadEnv({
      ...process.env,
      DATABASE_URL: testDb.databaseUrl,
      ADMIN_INTERNAL_TOKEN: ADMIN_TOKEN,
    });
    prisma = createPrismaClient(testDb.databaseUrl);
    app = await buildServer({ env, logger: false, prisma });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  it('401 — header eksik', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/internal/retention-purge' });
    expect(res.statusCode).toBe(401);
  });

  it('401 — yanlış token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/internal/retention-purge',
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('401 — Bearer prefix yok', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/internal/retention-purge',
      headers: { authorization: ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(401);
  });

  it('200 — geçerli token → boş purge report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/internal/retention-purge',
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; report: { processedCount: number } };
    expect(body.status).toBe('ok');
    expect(body.report.processedCount).toBe(0);
  });

  it('200 — gerçek bir purge candidate ile anonimize çalışır', async () => {
    await prisma.user.create({
      data: {
        phoneE164: `${MEMBER_PHONE_BASE}9001`,
        role: Role.member,
        firstName: 'Endpoint',
        lastName: 'Test',
        deletedAt: plusDaysFromNow(-RETENTION_DAYS - 1),
        retentionDeadline: plusDaysFromNow(-1),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/admin/internal/retention-purge',
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { report: { anonymizedCount: number } };
    expect(body.report.anonymizedCount).toBe(1);

    const fresh = await prisma.user.findFirst({ where: { firstName: '' } });
    expect(fresh).not.toBeNull();
    expect(fresh?.phoneE164).toMatch(/^deleted_[a-f0-9]{12}$/);
  });
});
