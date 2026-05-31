/**
 * TASK-2.03 — Programs API integration testleri.
 *
 * Dogrulanan senaryolar:
 *   POST /programs
 *     - 201 draft program olusur (trainerId + memberId dogru)
 *     - 403 trainer-member iliskisi olmayan uye icin
 *     - 400 memberId eksik
 *     - 403 member rolu
 *   PATCH /programs/:id
 *     - 200 tum yapi kaydedilir; ikinci PATCH uzerine yazar (idempotent)
 *     - 404 program bulunamadi
 *     - 403 baska trainer'in programi
 *     - 422 aktif/arsivlenmiş program duzenlenemez
 *     - 422 silinmis egzersiz patch'te reddedilir (TASK-2.16)
 *   POST /programs/:id/publish
 *     - 200 status active olur; publishedAt set edilir; bannerEvent donerPost
 *     - 200 eski aktif program arsivlenir (yeni program publish edilince)
 *     - 403 baska trainer'in programi
 *     - 403 zaten aktif program tekrar yayin yapilamaz (TASK-2.16)
 *     - 403 arsivlenmiş program tekrar yayin yapilamaz (TASK-2.16)
 *   POST /programs/:id/copy
 *     - 201 yeni draft program olusur; days+exercises kopyalanir
 *     - 403 hedef uye trainer-member iliskisi olmadan
 *     - 403 baska trainer'in programini kopyalayamaz
 *   GET /programs/:id
 *     - 200 trainer kendi programini tam yapiyla alir
 *     - 200 uye kendi programini alir
 *     - 403 trainer baska trainer'in programina erisemez
 *     - 403 uye baska uyenin programina erisemez
 *   GET /me/program
 *     - 200 aktif programi tam yapiyla + hasUnreadUpdate:true (tamamlama yokken)
 *     - 200 hasUnreadUpdate:false (son tamamlama publish'ten sonra)
 *     - 404 aktif program yokken
 *     - 403 trainer rolu
 *   GET /members/:memberId/program
 *     - 200 trainer kendi uyesinin aktif programini alir
 *     - 403 baska trainer'in uyesi icin 403
 *     - 404 uye icin aktif program yokken
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

describe('TASK-2.03 — Programs API', () => {
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

  async function linkTrainerMember(trainerId: string, memberId: string) {
    return server.prisma.trainerMember.create({ data: { trainerId, memberId } });
  }

  async function seedExercise(name = 'Squat') {
    return server.prisma.exercise.create({ data: { name, isCustom: false } });
  }

  function buildPatchBody(exerciseId: string) {
    return {
      days: [
        {
          dayOfWeek: 0,
          title: 'Pus Gunu',
          position: 0,
          exercises: [
            {
              exerciseId,
              sets: 3,
              reps: '8-12',
              restSeconds: 60,
              notes: 'Yavash ekzantrik',
              position: 0,
            },
          ],
        },
        {
          dayOfWeek: 2,
          title: 'Cek Gunu',
          position: 1,
          exercises: [{ exerciseId, sets: 4, reps: '6', position: 0 }],
        },
      ],
    };
  }

  // ── POST /programs ──────────────────────────────────────────────────────────

  describe('POST /programs', () => {
    it('201 — draft program olusur', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const res = await server.app.inject({
        method: 'POST',
        url: '/programs',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });

      expect(res.statusCode).toBe(201);
      const body = res.json<{ id: string; trainerId: string; memberId: string; status: string }>();
      expect(body.trainerId).toBe(trainer.id);
      expect(body.memberId).toBe(member.id);
      expect(body.status).toBe('draft');
      expect(body.id).toBeTruthy();
    });

    it('403 — trainer-member iliskisi olmayan uye icin', async () => {
      const { auth } = await trainerAuth();
      const { member } = await memberAuth();
      // Iliski kurulmadi

      const res = await server.app.inject({
        method: 'POST',
        url: '/programs',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('400 — memberId eksik', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/programs',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.statusCode).toBe(400);
    });

    it('403 — member rolu program olusturamaz', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/programs',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: 'some-id' }),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── PATCH /programs/:id ────────────────────────────────────────────────────

  describe('PATCH /programs/:id', () => {
    it('200 — tum yapi kaydedilir', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise();

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ id: string; days: unknown[] }>();
      expect(body.id).toBe(prog.id);
      expect(body.days).toHaveLength(2);
    });

    it('200 — ikinci PATCH ilk icerigin uzerine yazar (idempotent)', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise();

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });

      // Ilk PATCH
      await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      // Ikinci PATCH — sadece 1 gun
      const secondPatch = {
        days: [
          {
            dayOfWeek: 1,
            title: 'Bacak',
            position: 0,
            exercises: [{ exerciseId: exercise.id, sets: 5, reps: '10', position: 0 }],
          },
        ],
      };
      const res2 = await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(secondPatch),
      });

      expect(res2.statusCode).toBe(200);
      const body2 = res2.json<{ days: unknown[] }>();
      // Birinci PATCH'in 2 gunu degil, sadece 1 gun kalmali
      expect(body2.days).toHaveLength(1);

      // DB'de de sadece 1 gun kalmali
      const dbDays = await server.prisma.programDay.count({ where: { programId: prog.id } });
      expect(dbDays).toBe(1);
    });

    it('404 — program bulunamadi', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'PATCH',
        url: '/programs/nonexistent-id',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ days: [] }),
      });

      expect(res.statusCode).toBe(404);
    });

    it('403 — baska trainer programi duzenleyemez', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000001');
      const { auth: authB } = await trainerAuth('+905550000002');
      const { member } = await memberAuth();
      await linkTrainerMember(trainerA.id, member.id);
      const exercise = await seedExercise();

      const prog = await server.prisma.program.create({
        data: { trainerId: trainerA.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: authB, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      expect(res.statusCode).toBe(403);
    });

    it('422 — yayinlanmis program duzenlenemez', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise();

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      expect(res.statusCode).toBe(422);
    });

    it('422 — silinmis egzersiz patch icinde reddedilir (TASK-2.16)', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      // Soft-delete edilmiş egzersiz
      const deletedExercise = await server.prisma.exercise.create({
        data: { name: 'Silinmis Egzersiz', isCustom: false, deletedAt: new Date() },
      });

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(deletedExercise.id)),
      });

      expect(res.statusCode).toBe(422);
    });
  });

  // ── POST /programs/:id/publish ─────────────────────────────────────────────

  describe('POST /programs/:id/publish', () => {
    it('200 — status active olur; publishedAt set edilir; bannerEvent donerPost', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${prog.id}/publish`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{
        program: { status: string; publishedAt: string };
        bannerEvent: string;
      }>();
      expect(body.program.status).toBe('active');
      expect(body.program.publishedAt).toBeTruthy();
      expect(body.bannerEvent).toBe('program_changed');
    });

    it('200 — eski aktif program arsivlenir', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      // Eski aktif program
      const oldProg = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });
      // Yeni draft
      const newProg = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${newProg.id}/publish`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);

      // Eski program artik archived olmali
      const old = await server.prisma.program.findUnique({ where: { id: oldProg.id } });
      expect(old?.status).toBe('archived');
      expect(old?.archivedAt).toBeTruthy();
    });

    it('403 — baska trainer program yayinlayamaz', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000001');
      const { auth: authB } = await trainerAuth('+905550000002');
      const { member } = await memberAuth();
      await linkTrainerMember(trainerA.id, member.id);

      const prog = await server.prisma.program.create({
        data: { trainerId: trainerA.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${prog.id}/publish`,
        headers: { authorization: authB },
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — zaten aktif program tekrar yayinlanamaz (TASK-2.16)', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'active', publishedAt: new Date() },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${prog.id}/publish`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — arsivlenmis program yayinlanamaz (TASK-2.16)', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'archived',
          publishedAt: new Date(),
          archivedAt: new Date(),
        },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${prog.id}/publish`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── POST /programs/:id/copy ────────────────────────────────────────────────

  describe('POST /programs/:id/copy', () => {
    it('201 — yeni draft program olusur; days+exercises kopyalanir', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member: memberA } = await memberAuth('+905550000002');
      const { member: memberB } = await memberAuth('+905550000003');
      await linkTrainerMember(trainer.id, memberA.id);
      await linkTrainerMember(trainer.id, memberB.id);
      const exercise = await seedExercise();

      // Kaynak program
      const source = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: memberA.id, status: 'draft' },
      });
      await server.app.inject({
        method: 'PATCH',
        url: `/programs/${source.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${source.id}/copy`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ targetMemberId: memberB.id }),
      });

      expect(res.statusCode).toBe(201);
      const body = res.json<{ id: string; memberId: string; status: string }>();
      expect(body.memberId).toBe(memberB.id);
      expect(body.status).toBe('draft');
      expect(body.id).not.toBe(source.id);

      // DB'de yeni programin gunleri kopyalanmis olmali
      const newDays = await server.prisma.programDay.findMany({ where: { programId: body.id } });
      expect(newDays).toHaveLength(2);
    });

    it('403 — hedef uye trainer-member iliskisi olmadan', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member: memberA } = await memberAuth('+905550000002');
      const { member: memberB } = await memberAuth('+905550000003');
      await linkTrainerMember(trainer.id, memberA.id);
      // memberB ile iliski YOK

      const source = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: memberA.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${source.id}/copy`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ targetMemberId: memberB.id }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — baska trainer programini kopyalayamaz', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000001');
      const { trainer: trainerB, auth: authB } = await trainerAuth('+905550000002');
      const { member: memberA } = await memberAuth('+905550000003');
      const { member: memberB } = await memberAuth('+905550000004');
      await linkTrainerMember(trainerA.id, memberA.id);
      await linkTrainerMember(trainerB.id, memberB.id);

      const source = await server.prisma.program.create({
        data: { trainerId: trainerA.id, memberId: memberA.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'POST',
        url: `/programs/${source.id}/copy`,
        headers: { authorization: authB, 'content-type': 'application/json' },
        body: JSON.stringify({ targetMemberId: memberB.id }),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /programs/:id ──────────────────────────────────────────────────────

  describe('GET /programs/:id', () => {
    it('200 — trainer kendi programini tam yapiyla alir', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise('Bench Press');

      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'draft' },
      });
      await server.app.inject({
        method: 'PATCH',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(buildPatchBody(exercise.id)),
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/programs/${prog.id}`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{
        id: string;
        days: { exercises: { exercise: { name: string } }[] }[];
      }>();
      expect(body.id).toBe(prog.id);
      expect(body.days).toHaveLength(2);
      expect(body.days[0].exercises[0].exercise.name).toBe('Bench Press');
    });

    it('200 — uye kendi programini alir', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth: memberToken } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/programs/${prog.id}`,
        headers: { authorization: memberToken },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ id: string }>();
      expect(body.id).toBe(prog.id);
    });

    it('403 — trainer baska trainer programina erisemez', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000001');
      const { auth: authB } = await trainerAuth('+905550000002');
      const { member } = await memberAuth();
      await linkTrainerMember(trainerA.id, member.id);

      const prog = await server.prisma.program.create({
        data: { trainerId: trainerA.id, memberId: member.id, status: 'draft' },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/programs/${prog.id}`,
        headers: { authorization: authB },
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — uye baska uyenin programina erisemez', async () => {
      const { trainer } = await trainerAuth();
      const { member: memberA } = await memberAuth('+905550000002');
      const { auth: authB } = await memberAuth('+905550000003');
      await linkTrainerMember(trainer.id, memberA.id);

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: memberA.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/programs/${prog.id}`,
        headers: { authorization: authB },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /me/program ────────────────────────────────────────────────────────

  describe('GET /me/program', () => {
    it('200 — aktif programi tam yapiyla + hasUnreadUpdate:true (tamamlama yokken)', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise('Deadlift');

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });
      const day = await server.prisma.programDay.create({
        data: { programId: prog.id, dayOfWeek: 0, position: 0 },
      });
      await server.prisma.programDayExercise.create({
        data: { programDayId: day.id, exerciseId: exercise.id, sets: 3, reps: '10', position: 0 },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/program',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{
        id: string;
        hasUnreadUpdate: boolean;
        days: { exercises: { exercise: { name: string } }[] }[];
      }>();
      expect(body.id).toBe(prog.id);
      expect(body.hasUnreadUpdate).toBe(true);
      expect(body.days).toHaveLength(1);
      expect(body.days[0].exercises[0].exercise.name).toBe('Deadlift');
    });

    it('200 — hasUnreadUpdate:false (son tamamlama publish sonrasi)', async () => {
      const { trainer } = await trainerAuth();
      const { member, auth } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);

      const publishedAt = new Date('2026-05-30T10:00:00Z');
      const prog = await server.prisma.program.create({
        data: { trainerId: trainer.id, memberId: member.id, status: 'active', publishedAt },
      });
      const day = await server.prisma.programDay.create({
        data: { programId: prog.id, dayOfWeek: 0, position: 0 },
      });
      await seedExercise();

      // Publish'ten SONRA tamamlama
      const completedAt = new Date('2026-05-30T12:00:00Z');
      await server.prisma.workoutCompletion.create({
        data: {
          memberId: member.id,
          programDayId: day.id,
          scheduledDate: new Date('2026-05-30'),
          completedAt,
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/program',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ hasUnreadUpdate: boolean }>();
      expect(body.hasUnreadUpdate).toBe(false);
    });

    it('404 — aktif program yokken', async () => {
      const { auth } = await memberAuth();
      // Program yok

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/program',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(404);
    });

    it('403 — trainer rolu /me/program erisemez', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'GET',
        url: '/me/program',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /members/:memberId/program ─────────────────────────────────────────

  describe('GET /members/:memberId/program', () => {
    it('200 — trainer kendi uyesinin aktif programini alir', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      const exercise = await seedExercise();

      const prog = await server.prisma.program.create({
        data: {
          trainerId: trainer.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });
      await server.prisma.programDay.create({
        data: {
          programId: prog.id,
          dayOfWeek: 0,
          position: 0,
          exercises: { create: [{ exerciseId: exercise.id, sets: 3, reps: '10', position: 0 }] },
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/members/${member.id}/program`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ id: string }>();
      expect(body.id).toBe(prog.id);
    });

    it('403 — baska trainer uyesine erisemez', async () => {
      const { trainer: trainerA } = await trainerAuth('+905550000001');
      const { auth: authB } = await trainerAuth('+905550000002');
      const { member } = await memberAuth();
      await linkTrainerMember(trainerA.id, member.id);

      await server.prisma.program.create({
        data: {
          trainerId: trainerA.id,
          memberId: member.id,
          status: 'active',
          publishedAt: new Date(),
        },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: `/members/${member.id}/program`,
        headers: { authorization: authB },
      });

      expect(res.statusCode).toBe(403);
    });

    it('404 — uye icin aktif program yokken', async () => {
      const { trainer, auth } = await trainerAuth();
      const { member } = await memberAuth();
      await linkTrainerMember(trainer.id, member.id);
      // Program yok

      const res = await server.app.inject({
        method: 'GET',
        url: `/members/${member.id}/program`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
