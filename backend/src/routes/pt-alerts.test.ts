/**
 * TASK-3.10 — PT uyarı dismiss endpoint integration testleri.
 *
 * PATCH /pt/member-alerts/:memberId/dismiss-t7
 *   - 200 → ptT7DismissedAt set (geçerli trainer-member ilişkisi)
 *   - 403 → başka PT'nin üyesi (ownership kontrolü)
 *   - 403 → member rolü erişemez (trainer-only)
 *   - 401 → auth header eksik
 *
 * M3 §Teknik Notlar: "En yüksek test sıklığı + en katı kabul kriteri"
 * (ILKELER §En Yüksek Öncelikli Eksen #1)
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

describe('TASK-3.10 — PT Alerts API', () => {
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
    await server.prisma.notificationLog.deleteMany();
    await server.prisma.streakState.deleteMany();
    await server.prisma.trainerMember.deleteMany();
    await server.prisma.user.deleteMany();
  });

  // ─── Test helpers ──────────────────────────────────────────────────────────

  function createUser(phone: string, role: Role, firstName = 'Test', lastName = 'User') {
    return server.prisma.user.create({ data: { phoneE164: phone, role, firstName, lastName } });
  }

  async function trainerAuth(phone = '+905550000101') {
    const trainer = await createUser(phone, 'trainer', 'PT', 'Trainer');
    const auth = `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`;
    return { trainer, auth };
  }

  async function memberAuth(phone = '+905550000201') {
    const member = await createUser(phone, 'member', 'Uye', 'Test');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    return { member, auth };
  }

  async function linkTrainerMember(trainerId: string, memberId: string) {
    return server.prisma.trainerMember.create({ data: { trainerId, memberId } });
  }

  async function createStreakState(memberId: string) {
    return server.prisma.streakState.create({
      data: { memberId, currentStreak: 0, maxStreak: 0, streakResetAt: new Date() },
    });
  }

  // ── PATCH /pt/member-alerts/:memberId/dismiss-t7 ───────────────────────────

  describe('PATCH /pt/member-alerts/:memberId/dismiss-t7', () => {
    it('200 — geçerli trainer-member ilişkisi → ptT7DismissedAt set', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      await createStreakState(member.id);

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/pt/member-alerts/${member.id}/dismiss-t7`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);

      const state = await server.prisma.streakState.findUnique({ where: { memberId: member.id } });
      expect(state?.ptT7DismissedAt).not.toBeNull();
    });

    it('200 — StreakState olmasa bile endpoint hata vermez (updateMany idempotent)', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      // StreakState yok

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/pt/member-alerts/${member.id}/dismiss-t7`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
    });

    it('403 — başka PT nin üyesine dismiss → ownership ihlali', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000102');
      const { trainer: trainerB, auth: authB } = await trainerAuth('+905550000103');
      const { member } = await memberAuth('+905550000202');

      // trainerA → member ilişkisi var, trainerB yok
      await linkTrainerMember(trainerA.id, member.id);

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/pt/member-alerts/${member.id}/dismiss-t7`,
        headers: { authorization: authB },
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — member rolü trainer-only endpoint e erişemez', async () => {
      const { member, auth } = await memberAuth('+905550000203');

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/pt/member-alerts/${member.id}/dismiss-t7`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });

    it('401 — auth header eksik', async () => {
      const { member } = await memberAuth('+905550000204');

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/pt/member-alerts/${member.id}/dismiss-t7`,
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
