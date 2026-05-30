/**
 * TASK-1.22 — POST /auth/logout-all integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - 3 aktif refresh → logout-all sonrası 0 aktif (hepsi `revokedReason:'logout_all'`)
 *   - `user_logout_all` audit + metadata.count = revoke edilen token sayısı
 *   - Access token logout-all sonrası hâlâ geçerli (15dk; GET /auth/me 200) —
 *     beklenen davranış (logout-all access'i revoke etmez)
 *   - Yalnızca çağıran kullanıcının token'ları düşer, başka kullanıcı etkilenmez
 *   - Access token yok → 401 (middleware)
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';
import { issueRefreshToken } from '../auth/refresh-token.js';

import type { Role } from '../generated/prisma/enums.js';

function logoutAll(server: TestServer, authorization: string | undefined) {
  return server.app.inject({
    method: 'POST',
    url: '/auth/logout-all',
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('TASK-1.22 — POST /auth/logout-all', () => {
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

  it('204 — revokes all active tokens; audit count matches', async () => {
    const user = await createUser('+905554100011');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });
    // 3 cihaz (3 aile).
    await issueRefreshToken(server.prisma, { userId: user.id });
    await issueRefreshToken(server.prisma, { userId: user.id });
    await issueRefreshToken(server.prisma, { userId: user.id });

    const res = await logoutAll(server, `Bearer ${access}`);
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');

    const active = await server.prisma.refreshToken.findMany({
      where: { userId: user.id, revokedAt: null },
    });
    expect(active).toHaveLength(0);

    const revoked = await server.prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(revoked).toHaveLength(3);
    expect(revoked.every((r) => r.revokedReason === 'logout_all')).toBe(true);

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'user_logout_all' },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.metadata).toMatchObject({ count: 3 });
  });

  it('200 — access token still valid after logout-all (does not revoke access)', async () => {
    const user = await createUser('+905554100022');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });
    await issueRefreshToken(server.prisma, { userId: user.id });

    const out = await logoutAll(server, `Bearer ${access}`);
    expect(out.statusCode).toBe(204);

    // Aynı access token hâlâ korumalı route'a erişebilir (15dk pencere — kabul).
    const me = await server.app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${access}` },
    });
    expect(me.statusCode).toBe(200);
  });

  it('204 — only the caller’s tokens are revoked, others untouched', async () => {
    const caller = await createUser('+905554100033');
    const other = await createUser('+905554100044');
    const access = issueAccessToken(server.app, { id: caller.id, role: 'member' });
    await issueRefreshToken(server.prisma, { userId: caller.id });
    const otherToken = await issueRefreshToken(server.prisma, { userId: other.id });

    const res = await logoutAll(server, `Bearer ${access}`);
    expect(res.statusCode).toBe(204);

    // Başka kullanıcının token'ı dokunulmadan aktif kaldı.
    const row = await server.prisma.refreshToken.findUnique({ where: { id: otherToken.id } });
    expect(row?.revokedAt).toBeNull();
  });

  it('204 — logout-all with no active tokens still succeeds and audits count 0', async () => {
    const user = await createUser('+905554100055');
    const access = issueAccessToken(server.app, { id: user.id, role: 'member' });

    const res = await logoutAll(server, `Bearer ${access}`);
    expect(res.statusCode).toBe(204);

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'user_logout_all' },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.metadata).toMatchObject({ count: 0 });
  });

  it('401 — without access token', async () => {
    const res = await logoutAll(server, undefined);
    expect(res.statusCode).toBe(401);
  });
});
