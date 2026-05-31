/**
 * TASK-3.07 — Bildirim tercihleri API integration testleri.
 *
 * Doğrulanan senaryolar:
 *   GET /notification-preferences
 *     - 200 satır yok → default değerler döner (upsert)
 *     - 200 satır var → gerçek değerler döner
 *     - 403 trainer rolü erişemez
 *     - 401 auth yok
 *   PATCH /notification-preferences
 *     - 200 morningHour güncellendi, GET yeni değeri döner
 *     - 400 morningHour: 25 (0-23 dışı)
 *     - 400 morningMinute: 60 (0-59 dışı)
 *     - 403 trainer rolü erişemez
 *     - 401 auth yok
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

describe('TASK-3.07 — Notification Preferences API', () => {
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

  // ── GET /notification-preferences ─────────────────────────────────────────

  describe('GET /notification-preferences', () => {
    it('200 — satır yok → default değerler döner (upsert)', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/notification-preferences',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);

      const body = res.json();
      expect(body.reminderEnabled).toBe(true);
      expect(body.comebackEnabled).toBe(true);
      expect(body.systemEnabled).toBe(true);
      expect(body.morningHour).toBe(9);
      expect(body.morningMinute).toBe(0);
    });

    it('200 — satır var → gerçek değerler döner', async () => {
      const { member, auth } = await memberAuth();

      await server.prisma.notificationPreference.create({
        data: {
          memberId: member.id,
          reminderEnabled: false,
          comebackEnabled: true,
          systemEnabled: true,
          morningHour: 7,
          morningMinute: 30,
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/notification-preferences',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);

      const body = res.json();
      expect(body.reminderEnabled).toBe(false);
      expect(body.morningHour).toBe(7);
      expect(body.morningMinute).toBe(30);
    });

    it('403 — trainer rolü erişemez', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/notification-preferences',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });

    it('401 — auth yok', async () => {
      const res = await server.app.inject({
        method: 'GET',
        url: '/notification-preferences',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /notification-preferences ───────────────────────────────────────

  describe('PATCH /notification-preferences', () => {
    it('200 — morningHour güncellendi, GET yeni değer döner', async () => {
      const { auth } = await memberAuth();

      const patchRes = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ morningHour: 7 }),
      });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.json().morningHour).toBe(7);

      const getRes = await server.app.inject({
        method: 'GET',
        url: '/notification-preferences',
        headers: { authorization: auth },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.json().morningHour).toBe(7);
    });

    it('200 — reminderEnabled false → geri alınan tercih false', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ reminderEnabled: false }),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().reminderEnabled).toBe(false);
      // diğer alanlar default kalır
      expect(res.json().morningHour).toBe(9);
    });

    it('400 — morningHour: 25 (geçersiz, 0-23 dışı)', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ morningHour: 25 }),
      });

      expect(res.statusCode).toBe(400);
    });

    it('400 — morningMinute: 60 (geçersiz, 0-59 dışı)', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ morningMinute: 60 }),
      });

      expect(res.statusCode).toBe(400);
    });

    it('403 — trainer rolü erişemez', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ morningHour: 8 }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('401 — auth yok', async () => {
      const res = await server.app.inject({
        method: 'PATCH',
        url: '/notification-preferences',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ morningHour: 8 }),
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
