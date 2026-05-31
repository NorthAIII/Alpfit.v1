/**
 * TASK-2.04 — WorkoutCompletions API integration testleri.
 *
 * Dogrulanan senaryolar:
 *   POST /workout-completions
 *     - 200 tamamlama kaydedilir, programDay iliskisi gelir
 *     - 200 ayni (memberId, programDayId, scheduledDate) tekrar gonderilirse DB'de tek kayit (idempotent)
 *     - 400 body eksik
 *     - 403 trainer rolu
 *     - 403 uye baska uyenin programDayId'si ile tamamlama yapamaz (TASK-2.16)
 *   GET /me/workout-completions
 *     - 200 paginated list donerken en yeni uste
 *     - 200 cursor sonrasi kayitlar donerken, oncekiler yok
 *     - 200 hic kayit yoksa { items: [], nextCursor: null }
 *     - 403 trainer rolu
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

describe('TASK-2.04 — WorkoutCompletions API', () => {
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
    await server.prisma.workoutCompletion.deleteMany();
    await server.prisma.programDayExercise.deleteMany();
    await server.prisma.programDay.deleteMany();
    await server.prisma.program.deleteMany();
    await server.prisma.exercise.deleteMany();
    await server.prisma.trainerMember.deleteMany();
    await server.prisma.invitation.deleteMany();
    await server.prisma.user.deleteMany();
  });

  // ─── Test helpers ─────────────────────────────────────────────────────────

  function createUser(phone: string, role: Role, firstName = 'Test', lastName = 'User') {
    return server.prisma.user.create({ data: { phoneE164: phone, role, firstName, lastName } });
  }

  async function trainerAuth(phone = '+905550000001') {
    const trainer = await createUser(phone, 'trainer', 'Mehmet', 'Demir');
    const auth = `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`;
    return { trainer, auth };
  }

  async function memberAuth(phone = '+905550000099') {
    const member = await createUser(phone, 'member', 'Ayse', 'Kaya');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    return { member, auth };
  }

  async function seedProgramWithDay(trainerId: string, memberId: string) {
    const program = await server.prisma.program.create({
      data: { trainerId, memberId, status: 'active', publishedAt: new Date() },
    });
    const day = await server.prisma.programDay.create({
      data: { programId: program.id, dayOfWeek: 0, position: 0 },
    });
    return { program, day };
  }

  // ── POST /workout-completions ──────────────────────────────────────────────

  describe('POST /workout-completions', () => {
    it('200 — tamamlama kaydedilir', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      const { day } = await seedProgramWithDay(trainer.id, member.id);

      const res = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({
          programDayId: day.id,
          scheduledDate: '2026-05-30T00:00:00.000Z',
        }),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{
        id: string;
        memberId: string;
        programDayId: string;
        isLate: boolean;
      }>();
      expect(body.memberId).toBe(member.id);
      expect(body.programDayId).toBe(day.id);
      expect(body.isLate).toBe(false);
      expect(body.id).toBeTruthy();

      const dbCount = await server.prisma.workoutCompletion.count({
        where: { memberId: member.id },
      });
      expect(dbCount).toBe(1);
    });

    it("200 — ayni data tekrar gonderilirse DB'de tek kayit kalir (idempotent)", async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      const { day } = await seedProgramWithDay(trainer.id, member.id);

      const payload = JSON.stringify({
        programDayId: day.id,
        scheduledDate: '2026-05-30T00:00:00.000Z',
      });

      // Birinci istek
      const res1 = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: payload,
      });
      expect(res1.statusCode).toBe(200);
      const body1 = res1.json<{ id: string }>();

      // Ikinci istek (ayni data)
      const res2 = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: payload,
      });
      expect(res2.statusCode).toBe(200);
      const body2 = res2.json<{ id: string }>();

      // Ayni kayit donmeli
      expect(body2.id).toBe(body1.id);

      // DB'de tek kayit olmali
      const dbCount = await server.prisma.workoutCompletion.count({
        where: { memberId: member.id },
      });
      expect(dbCount).toBe(1);
    });

    it('400 — body eksik', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.statusCode).toBe(400);
    });

    it('403 — trainer rolu tamamlama yapamaz', async () => {
      const { auth: trainerAuthToken } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: trainerAuthToken, 'content-type': 'application/json' },
        body: JSON.stringify({
          programDayId: 'some-id',
          scheduledDate: '2026-05-30T00:00:00.000Z',
        }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — uye baska uyenin programDayId ile tamamlama yapamaz (TASK-2.16)', async () => {
      const { trainer } = await trainerAuth('+905550000001');
      const { member: memberA } = await memberAuth('+905550000002');
      const { auth: authB } = await memberAuth('+905550000003');

      // memberA'nın aktif programı ve günü
      const { day } = await seedProgramWithDay(trainer.id, memberA.id);

      // memberB, memberA'nın gün ID'siyle tamamlama yapmaya çalışıyor
      const res = await server.app.inject({
        method: 'POST',
        url: '/workout-completions',
        headers: { authorization: authB, 'content-type': 'application/json' },
        body: JSON.stringify({
          programDayId: day.id,
          scheduledDate: '2026-05-30T00:00:00.000Z',
        }),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /me/workout-completions ────────────────────────────────────────────

  describe('GET /me/workout-completions', () => {
    it('200 — paginated list donerken en yeni uste', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      const { day } = await seedProgramWithDay(trainer.id, member.id);

      // Iki kayit ekle — farkli tarihler
      await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-28T00:00:00.000Z'),
          completedAt: new Date('2026-05-28T10:00:00.000Z'),
          isLate: false,
        },
      });
      await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-29T00:00:00.000Z'),
          completedAt: new Date('2026-05-29T11:00:00.000Z'),
          isLate: false,
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/workout-completions',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{
        items: Array<{ scheduledDate: string }>;
        nextCursor: string | null;
      }>();
      expect(body.items).toHaveLength(2);
      // En yeni uste — 29 Mayıs
      expect(new Date(body.items[0]!.scheduledDate).getTime()).toBeGreaterThan(
        new Date(body.items[1]!.scheduledDate).getTime(),
      );
    });

    it('200 — cursor sonrasi kayitlar donerken, oncekiler yok', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      const { day } = await seedProgramWithDay(trainer.id, member.id);

      // 3 kayit olustur — farkli scheduledDate ile idempotency asilir
      const c1 = await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-27T00:00:00.000Z'),
          completedAt: new Date('2026-05-27T09:00:00.000Z'),
          isLate: false,
        },
      });
      await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-28T00:00:00.000Z'),
          completedAt: new Date('2026-05-28T09:00:00.000Z'),
          isLate: false,
        },
      });
      const c3 = await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-29T00:00:00.000Z'),
          completedAt: new Date('2026-05-29T09:00:00.000Z'),
          isLate: false,
        },
      });

      // cursor olarak c3.id (en yeni) kullan — c3'ten oncekiler gelmeli
      const res = await server.app.inject({
        method: 'GET',
        url: `/me/workout-completions?cursor=${c3.id}`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ items: Array<{ id: string }>; nextCursor: string | null }>();
      // c3 dahil degil (lt cursor), sadece daha kucuk id'ler
      const ids = body.items.map((i) => i.id);
      expect(ids).not.toContain(c3.id);
      // c1 kesinlikle olmali
      expect(ids).toContain(c1.id);
    });

    it('200 — hic kayit yoksa bos liste donerken nextCursor null', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/workout-completions',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ items: unknown[]; nextCursor: unknown }>();
      expect(body.items).toHaveLength(0);
      expect(body.nextCursor).toBeNull();
    });

    it('403 — trainer rolu gecmisi goremez', async () => {
      const { auth: trainerAuthToken } = await trainerAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/workout-completions',
        headers: { authorization: trainerAuthToken },
      });

      expect(res.statusCode).toBe(403);
    });

    it('400 — limit=abc gecersiz query param (TASK-3.01)', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/workout-completions?limit=abc',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(400);
    });

    it('200 — limit=5 sorgusu max 5 kayit donerken (TASK-3.01)', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      const { day } = await seedProgramWithDay(trainer.id, member.id);

      // 7 kayit olustur (farkli scheduledDate ile)
      for (let i = 1; i <= 7; i++) {
        await server.prisma.workoutCompletion.create({
          data: {
            memberId: member.id,
            programDayId: day.id,
            scheduledDate: new Date(`2026-05-${String(i).padStart(2, '0')}T00:00:00.000Z`),
            completedAt: new Date(`2026-05-${String(i).padStart(2, '0')}T10:00:00.000Z`),
            isLate: false,
          },
        });
      }

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/workout-completions?limit=5',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ items: unknown[]; nextCursor: string | null }>();
      expect(body.items).toHaveLength(5);
      expect(body.nextCursor).not.toBeNull();
    });
  });
});
