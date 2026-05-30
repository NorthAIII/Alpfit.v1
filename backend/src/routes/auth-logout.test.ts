/**
 * TASK-1.22 — POST /auth/logout integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Bu cihazdan çıkış: verilen refresh token revoke (`revokedReason:'logout'`),
 *     aynı kullanıcının diğer cihaz token'ı aktif kalır + `user_logout` audit
 *   - Başka kullanıcının refresh token'ını revoke etmeye çalışma → 403 (hedef
 *     token aktif kalır)
 *   - Zaten revoke edilmiş token logout → 204 (idempotent, yeni audit yok)
 *   - Bilinmeyen token → 204 (idempotent, sızdırma yok)
 *   - Eksik gövde → 400
 *   - Access token yok → 401 (middleware)
 *
 * Access token'lar gerçek server jwt instance'ı üzerinden (`issueAccessToken`),
 * refresh token'lar `issueRefreshToken` helper'ı ile tohumlanır. Per-suite
 * Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';
import { issueRefreshToken } from '../auth/refresh-token.js';

import type { Role } from '../generated/prisma/enums.js';

function logout(server: TestServer, authorization: string | undefined, refreshToken: unknown) {
  return server.app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: authorization === undefined ? {} : { authorization },
    payload: refreshToken === undefined ? {} : { refreshToken },
  });
}

describe('TASK-1.22 — POST /auth/logout', () => {
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

  it('204 — logs out current device: token revoked, other device stays active', async () => {
    const user = await createUser('+905553100011');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });
    // İki cihaz (iki aile).
    const deviceA = await issueRefreshToken(server.prisma, { userId: user.id });
    const deviceB = await issueRefreshToken(server.prisma, { userId: user.id });

    const res = await logout(server, `Bearer ${access}`, deviceA.token);
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');

    const a = await server.prisma.refreshToken.findUnique({ where: { id: deviceA.id } });
    expect(a?.revokedAt).not.toBeNull();
    expect(a?.revokedReason).toBe('logout');

    // Diğer cihaz dokunulmadan aktif kaldı.
    const b = await server.prisma.refreshToken.findUnique({ where: { id: deviceB.id } });
    expect(b?.revokedAt).toBeNull();

    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'user_logout' } });
    expect(audit).toHaveLength(1);
  });

  it('403 — cannot revoke another user’s refresh token', async () => {
    const attacker = await createUser('+905553100022');
    const victim = await createUser('+905553100033');
    const access = issueAccessToken(server.app, { id: attacker.id, role: 'member' });
    const victimToken = await issueRefreshToken(server.prisma, { userId: victim.id });

    const res = await logout(server, `Bearer ${access}`, victimToken.token);
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ status: 'forbidden' });

    // Kurbanın token'ı dokunulmadan aktif kaldı.
    const row = await server.prisma.refreshToken.findUnique({ where: { id: victimToken.id } });
    expect(row?.revokedAt).toBeNull();

    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'user_logout' } });
    expect(audit).toHaveLength(0);
  });

  it('204 — logging out an already-revoked token is idempotent (no new audit)', async () => {
    const user = await createUser('+905553100044');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });

    const first = await logout(server, `Bearer ${access}`, issued.token);
    expect(first.statusCode).toBe(204);

    const second = await logout(server, `Bearer ${access}`, issued.token);
    expect(second.statusCode).toBe(204);

    // Sadece ilk gerçek revoke audit yazdı.
    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'user_logout' } });
    expect(audit).toHaveLength(1);
  });

  it('204 — unknown token is idempotent (no leak, no audit)', async () => {
    const user = await createUser('+905553100055');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });

    const res = await logout(server, `Bearer ${access}`, 'definitely-not-a-real-opaque-token');
    expect(res.statusCode).toBe(204);

    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'user_logout' } });
    expect(audit).toHaveLength(0);
  });

  it('400 — missing refreshToken in body', async () => {
    const user = await createUser('+905553100066');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });

    const res = await logout(server, `Bearer ${access}`, undefined);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 'invalid' });
  });

  it('401 — without access token', async () => {
    const user = await createUser('+905553100077');
    const issued = await issueRefreshToken(server.prisma, { userId: user.id });

    const res = await logout(server, undefined, issued.token);
    expect(res.statusCode).toBe(401);
  });
});
