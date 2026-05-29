/**
 * TASK-1.21 — POST /auth/refresh integration testleri.
 *
 * Doğrulanan senaryolar (rotate-on-use + replay detection):
 *   - Geçerli refresh → 200; yeni access + yeni refresh (URL-safe), eski token
 *     `revokedReason:'rotated'`, yeni token aynı aile + previousId zinciri
 *   - Eski (rotated) refresh ile retry → 401 replay + AİLE iptal (tüm aktif
 *     token'lar `revokedReason:'replay_detected'`), `refresh_replay_detected` audit
 *   - Expired refresh → 401 expired + DB row korunur + `refresh_expired` audit
 *   - Geçersiz token → 401 invalid_refresh
 *   - Eksik gövde → 400
 *   - İki aile (device) izolasyonu: bir ailede replay diğerini etkilemez
 *   - Concurrent 2 refresh aynı token → biri 200 biri 401 (atomik compare-and-set)
 *   - Soft-delete'li kullanıcının token'ı → 401 invalid
 *
 * Token'lar `issueRefreshToken` helper'ı ile gerçek hash deseni üzerinden
 * tohumlanır (ham token sadece bellekten gelir; DB'de hash). Per-suite Postgres
 * (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  issueRefreshToken,
} from '../auth/refresh-token.js';

import type { Role } from '../generated/prisma/enums.js';

function refresh(server: TestServer, refreshToken: unknown) {
  return server.app.inject({
    method: 'POST',
    url: '/auth/refresh',
    payload: refreshToken === undefined ? {} : { refreshToken },
  });
}

describe('TASK-1.21 — POST /auth/refresh', () => {
  let testDb: TestDatabase;
  let server: TestServer;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    server = await buildTestServer({ databaseUrl: testDb.databaseUrl });
  });

  afterAll(async () => {
    await server.app.close();
    await server.prisma.$disconnect();
    await server.closeRedis();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    await server.prisma.refreshToken.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  function createUser(phone: string, role: Role = 'member') {
    return server.prisma.user.create({
      data: { phoneE164: phone, role, firstName: 'Ada', lastName: 'Yıldız' },
    });
  }

  it('200 — valid refresh rotates: new access + new URL-safe refresh, old revoked', async () => {
    const user = await createUser('+905552100011');
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });

    const res = await refresh(server, issued.token);
    expect(res.statusCode).toBe(200);
    const json = res.json() as { accessToken: string; refreshToken: string; expiresAt: string };
    expect(typeof json.accessToken).toBe('string');
    expect(typeof json.refreshToken).toBe('string');
    expect(json.refreshToken).not.toBe(issued.token);
    // base64url → URL-safe (mobile'da güvenle taşır).
    expect(json.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(new Date(json.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const old = await server.prisma.refreshToken.findUnique({ where: { id: issued.id } });
    expect(old?.revokedAt).not.toBeNull();
    expect(old?.revokedReason).toBe('rotated');

    const fresh = await server.prisma.refreshToken.findFirst({ where: { revokedAt: null } });
    expect(fresh?.familyId).toBe(issued.familyId);
    expect(fresh?.previousId).toBe(issued.id);
    expect(fresh?.tokenHash).toBe(hashRefreshToken(json.refreshToken));

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'refresh_rotated' },
    });
    expect(audit).toHaveLength(1);
  });

  it('401 — reusing a rotated refresh is replay: whole family revoked', async () => {
    const user = await createUser('+905552100022');
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });

    const r1 = await refresh(server, issued.token);
    expect(r1.statusCode).toBe(200);
    const rotatedOut = (r1.json() as { refreshToken: string }).refreshToken;

    // Eski (artık rotated) token tekrar → replay.
    const r2 = await refresh(server, issued.token);
    expect(r2.statusCode).toBe(401);
    expect(r2.json()).toMatchObject({ status: 'replay' });

    // Aile tamamen düştü — aktif token kalmadı.
    const active = await server.prisma.refreshToken.findMany({
      where: { familyId: issued.familyId, revokedAt: null },
    });
    expect(active).toHaveLength(0);

    // Rotation'la üretilen token da replay_detected ile iptal.
    const rotatedOutRow = await server.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rotatedOut) },
    });
    expect(rotatedOutRow?.revokedReason).toBe('replay_detected');

    // Artık o token da kullanılamaz.
    const r3 = await refresh(server, rotatedOut);
    expect(r3.statusCode).toBe(401);

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'refresh_replay_detected' },
    });
    expect(audit.length).toBeGreaterThanOrEqual(1);
  });

  it('401 — expired refresh is rejected but the row is preserved', async () => {
    const user = await createUser('+905552100033');
    const { token, tokenHash } = generateRefreshToken();
    await server.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: 'fam-expired',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await refresh(server, token);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ status: 'expired' });

    const row = await server.prisma.refreshToken.findUnique({ where: { tokenHash } });
    expect(row).not.toBeNull();

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'refresh_expired' },
    });
    expect(audit).toHaveLength(1);
  });

  it('401 — unknown token is invalid_refresh', async () => {
    const res = await refresh(server, 'definitely-not-a-real-opaque-token');
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ status: 'invalid_refresh' });
  });

  it('400 — missing refreshToken in body', async () => {
    const res = await refresh(server, undefined);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 'invalid' });
  });

  it('200 — replay in one family does not affect another family (device isolation)', async () => {
    const user = await createUser('+905552100044');
    const famA = await issueRefreshToken(server.prisma, { userId: user.id });
    const famB = await issueRefreshToken(server.prisma, { userId: user.id });
    expect(famA.familyId).not.toBe(famB.familyId);

    // Aile A'da replay tetikle (rotate sonra eski token'ı tekrar kullan).
    await refresh(server, famA.token);
    const replayed = await refresh(server, famA.token);
    expect(replayed.statusCode).toBe(401);

    // Aile B etkilenmedi — hâlâ rotate edilebilir.
    const bRes = await refresh(server, famB.token);
    expect(bRes.statusCode).toBe(200);
  });

  it('200/401 — concurrent refresh with the same token: one wins, one replay-rejected', async () => {
    const user = await createUser('+905552100055');
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });

    const [a, b] = await Promise.all([
      refresh(server, issued.token),
      refresh(server, issued.token),
    ]);
    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 401]);

    // İlk token her iki durumda da artık aktif değil.
    const old = await server.prisma.refreshToken.findUnique({ where: { id: issued.id } });
    expect(old?.revokedAt).not.toBeNull();
  });

  it('401 — refresh for a soft-deleted user is rejected', async () => {
    const user = await createUser('+905552100066');
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });
    await server.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    const res = await refresh(server, issued.token);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ status: 'invalid_refresh' });
  });
});
