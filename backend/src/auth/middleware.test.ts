/**
 * TASK-1.20 — `app.authenticate` guard integration testleri (GET /auth/me ile).
 *
 *   - Geçerli access token → 200 + profil
 *   - Token yok → 401
 *   - Expired access token → 401
 *   - Kayıt jetonu (typ:registration) korumalı route'a → 401 (yanlış tip)
 *   - Soft-delete'li kullanıcının token'ı → 401 (DB aktiflik kontrolü)
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts). Token'lar gerçek
 * server'ın jwt instance'ı (`server.app.jwt`) üzerinden üretilir.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';

import { issueAccessToken, issueRegistrationToken } from './jwt.js';

function me(server: TestServer, authorization?: string) {
  return server.app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('TASK-1.20 — auth guard (GET /auth/me)', () => {
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
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  it('200 — valid access token returns the owner profile', async () => {
    const user = await server.prisma.user.create({
      data: { phoneE164: '+905551300011', role: 'trainer', firstName: 'Mert', lastName: 'Demir' },
    });
    const token = issueAccessToken(server.app, { id: user.id, role: 'trainer' });

    const res = await me(server, `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      user: { id: user.id, role: 'trainer', firstName: 'Mert', phoneE164: '+905551300011' },
    });
  });

  it('401 — missing token', async () => {
    const res = await me(server);
    expect(res.statusCode).toBe(401);
  });

  it('401 — expired access token', async () => {
    const user = await server.prisma.user.create({
      data: { phoneE164: '+905551300022', role: 'member', firstName: 'Ece', lastName: 'Kaya' },
    });
    const expired = server.app.jwt.sign(
      { sub: user.id, role: 'member', typ: 'access', jti: 'jti-exp' },
      { expiresIn: -10 },
    );
    const res = await me(server, `Bearer ${expired}`);
    expect(res.statusCode).toBe(401);
  });

  it('401 — registration token rejected on a protected route (wrong typ)', async () => {
    const regToken = issueRegistrationToken(server.app, '+905551300033');
    const res = await me(server, `Bearer ${regToken}`);
    expect(res.statusCode).toBe(401);
  });

  it('401 — soft-deleted user cannot authenticate', async () => {
    const user = await server.prisma.user.create({
      data: {
        phoneE164: '+905551300044',
        role: 'member',
        firstName: 'Can',
        lastName: 'Acar',
        deletedAt: new Date(),
      },
    });
    const token = issueAccessToken(server.app, { id: user.id, role: 'member' });
    const res = await me(server, `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });
});
