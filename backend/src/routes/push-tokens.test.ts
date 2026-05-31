/**
 * TASK-3.06 — Push token yönetimi API integration testleri.
 *
 * Doğrulanan senaryolar:
 *   POST /push-tokens
 *     - 201 yeni token kaydedilir, DB'de kayıt var
 *     - 201 aynı token tekrar gönderilirse duplicate yok (upsert — idempotent)
 *     - 400 platform eksik
 *     - 401 auth header eksik
 *   DELETE /push-tokens
 *     - 204 kendi tokeni silindi, DB'den gitti
 *     - 204 başka kullanıcının tokeni — 204 döner ama token hâlâ DB'de (ownership)
 *     - 204 olmayan token — idempotent
 *     - 401 auth header eksik
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

describe('TASK-3.06 — Push Token API', () => {
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
    await server.prisma.pushToken.deleteMany();
    await server.prisma.notificationLog.deleteMany();
    await server.prisma.streakState.deleteMany();
    await server.prisma.notificationPreference.deleteMany();
    await server.prisma.user.deleteMany();
  });

  // ─── Test helpers ──────────────────────────────────────────────────────────

  function createUser(phone: string, role: Role, firstName = 'Test', lastName = 'User') {
    return server.prisma.user.create({ data: { phoneE164: phone, role, firstName, lastName } });
  }

  async function memberAuth(phone = '+905550000099') {
    const member = await createUser(phone, 'member', 'Ayse', 'Kaya');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    return { member, auth };
  }

  async function trainerAuth(phone = '+905550000001') {
    const trainer = await createUser(phone, 'trainer', 'Mehmet', 'Demir');
    const auth = `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`;
    return { trainer, auth };
  }

  // ── POST /push-tokens ──────────────────────────────────────────────────────

  describe('POST /push-tokens', () => {
    it('201 — yeni token kaydedilir, DB kayıt var', async () => {
      const { member, auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[test-token-123]', platform: 'ios' }),
      });

      expect(res.statusCode).toBe(201);

      const row = await server.prisma.pushToken.findFirst({
        where: { userId: member.id },
      });
      expect(row).not.toBeNull();
      expect(row?.token).toBe('ExponentPushToken[test-token-123]');
      expect(row?.platform).toBe('ios');
    });

    it('201 — aynı token tekrar gönderilirse duplicate yok (upsert)', async () => {
      const { member, auth } = await memberAuth();

      const payload = JSON.stringify({
        token: 'ExponentPushToken[upsert-test]',
        platform: 'android',
      });

      await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: payload,
      });

      const res2 = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: payload,
      });

      expect(res2.statusCode).toBe(201);

      const count = await server.prisma.pushToken.count({ where: { userId: member.id } });
      expect(count).toBe(1);
    });

    it('201 — trainer da token kaydedebilir', async () => {
      const { trainer, auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[trainer-token]', platform: 'ios' }),
      });

      expect(res.statusCode).toBe(201);

      const count = await server.prisma.pushToken.count({ where: { userId: trainer.id } });
      expect(count).toBe(1);
    });

    it('400 — platform eksik', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[no-platform]' }),
      });

      expect(res.statusCode).toBe(400);
    });

    it('400 — geçersiz platform değeri', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[bad-platform]', platform: 'web' }),
      });

      expect(res.statusCode).toBe(400);
    });

    it('401 — auth header eksik', async () => {
      const res = await server.app.inject({
        method: 'POST',
        url: '/push-tokens',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[no-auth]', platform: 'ios' }),
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── DELETE /push-tokens ────────────────────────────────────────────────────

  describe('DELETE /push-tokens', () => {
    it('204 — kendi tokeni silindi, DB den gitti', async () => {
      const { member, auth } = await memberAuth();

      // Önce token kaydet
      await server.prisma.pushToken.create({
        data: { userId: member.id, token: 'ExponentPushToken[delete-me]', platform: 'ios' },
      });

      const res = await server.app.inject({
        method: 'DELETE',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[delete-me]' }),
      });

      expect(res.statusCode).toBe(204);

      const row = await server.prisma.pushToken.findFirst({
        where: { token: 'ExponentPushToken[delete-me]' },
      });
      expect(row).toBeNull();
    });

    it('204 — başka kullanıcının tokeni: 204 döner ama token DB de hala var (ownership)', async () => {
      const { member: memberA } = await memberAuth('+905550000002');
      const { auth: authB } = await memberAuth('+905550000003');

      // memberA'nın tokeni
      await server.prisma.pushToken.create({
        data: {
          userId: memberA.id,
          token: 'ExponentPushToken[other-user]',
          platform: 'android',
        },
      });

      // memberB, memberA'nın tokenını silmeye çalışıyor
      const res = await server.app.inject({
        method: 'DELETE',
        url: '/push-tokens',
        headers: { authorization: authB, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[other-user]' }),
      });

      expect(res.statusCode).toBe(204);

      // Token hâlâ var (silinmedi)
      const row = await server.prisma.pushToken.findFirst({
        where: { token: 'ExponentPushToken[other-user]' },
      });
      expect(row).not.toBeNull();
    });

    it('204 — olmayan token: idempotent', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'DELETE',
        url: '/push-tokens',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[nonexistent]' }),
      });

      expect(res.statusCode).toBe(204);
    });

    it('401 — auth header eksik', async () => {
      const res = await server.app.inject({
        method: 'DELETE',
        url: '/push-tokens',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[no-auth]' }),
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
