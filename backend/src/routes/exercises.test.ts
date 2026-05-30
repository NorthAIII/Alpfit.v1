/**
 * TASK-2.02 — Exercises API integration testleri.
 *
 * Dogrulanan senaryolar:
 *   GET /exercises
 *     - 200 cekirdek egzersizleri doner
 *     - 200 search=gogus -> isim icinde "gogus" gecenler (ILIKE)
 *     - 200 muscleGroup=bacak -> kas grubu "Bacak" olanlar (insensitive equals)
 *     - 200 trainerin customlari da listelenir
 *     - 200 baska trainerin customu sizmaz
 *     - 200 silinmis egzersiz listede yok
 *     - 403 member rolu
 *     - 401 token yok
 *   POST /exercises
 *     - 201 trainer custom egzersiz ekler (id, name, isCustom=true doner)
 *     - 400 name eksik -> validation hatasi
 *     - 403 member rolu
 *   PUT /exercises/:id
 *     - 200 trainer kendi customunu gunceller
 *     - 403 cekirdek egzersiz duzenlenemez
 *     - 403 baska trainerin customu
 *     - 404 egzersiz bulunamadi
 *   DELETE /exercises/:id
 *     - 204 soft delete; tekrar GET -> listede yok
 *     - 403 cekirdek egzersiz silinemez
 *     - 403 baska trainerin customu silinemez
 *     - 404 egzersiz bulunamadi
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  isCustom: boolean;
}

describe('TASK-2.02 — Exercises API', () => {
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
    await server.prisma.exercise.deleteMany();
    await server.prisma.user.deleteMany();
  });

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

  function seedCoreExercises() {
    return server.prisma.exercise.createMany({
      data: [
        { name: 'Squat', muscleGroup: 'Bacak', isCustom: false },
        { name: 'Gogus Presi', muscleGroup: 'Gogus', isCustom: false },
        { name: 'Barfiks', muscleGroup: 'Sirt', isCustom: false },
        { name: 'Olu Kaldirish', muscleGroup: 'Arka Zincir', isCustom: false },
        { name: 'Leg Press', muscleGroup: 'Bacak', isCustom: false },
      ],
    });
  }

  // ── GET /exercises ──────────────────────────────────────────────────────────

  describe('GET /exercises', () => {
    it('200 — cekirdek egzersizleri listeler', async () => {
      const { auth } = await trainerAuth();
      await seedCoreExercises();

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      expect(body.length).toBeGreaterThanOrEqual(5);
    });

    it('200 — search ile egzersiz arar (ILIKE)', async () => {
      const { auth } = await trainerAuth();
      await seedCoreExercises();

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises?search=gogus',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body.every((ex) => ex.name.toLowerCase().includes('gogus'))).toBe(true);
    });

    it('200 — muscleGroup filtresi calisir (case-insensitive)', async () => {
      const { auth } = await trainerAuth();
      await seedCoreExercises();

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises?muscleGroup=bacak',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      expect(body.length).toBeGreaterThanOrEqual(2); // Squat + Leg Press
      expect(body.every((ex) => ex.muscleGroup?.toLowerCase() === 'bacak')).toBe(true);
    });

    it('200 — trainer kendi custom egzersizini gorur', async () => {
      const { trainer, auth } = await trainerAuth();
      await seedCoreExercises();
      await server.prisma.exercise.create({
        data: { name: 'Ozel Hareket', isCustom: true, createdById: trainer.id },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      const custom = body.find((ex) => ex.name === 'Ozel Hareket');
      expect(custom).toBeDefined();
      expect(custom?.isCustom).toBe(true);
    });

    it('200 — baska trainerin customu sizmaz', async () => {
      const { auth: authA } = await trainerAuth('+905550000001');
      const { trainer: trainerB } = await trainerAuth('+905550000002');
      await server.prisma.exercise.create({
        data: { name: 'B Trainer Custom', isCustom: true, createdById: trainerB.id },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: authA },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      expect(body.find((ex) => ex.name === 'B Trainer Custom')).toBeUndefined();
    });

    it('200 — silinmis egzersiz listede gorünmez', async () => {
      const { trainer, auth } = await trainerAuth();
      const ex = await server.prisma.exercise.create({
        data: { name: 'Silinecek Hareket', isCustom: true, createdById: trainer.id },
      });
      await server.prisma.exercise.update({
        where: { id: ex.id },
        data: { deletedAt: new Date() },
      });

      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem[]>();
      expect(body.find((e) => e.id === ex.id)).toBeUndefined();
    });

    it('403 — member rolu egzersiz listesine erisemez', async () => {
      const { auth } = await memberAuth();
      const res = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(403);
    });

    it('401 — token yok', async () => {
      const res = await server.app.inject({ method: 'GET', url: '/exercises' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── POST /exercises ─────────────────────────────────────────────────────────

  describe('POST /exercises', () => {
    it('201 — trainer custom egzersiz ekler', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/exercises',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Yeni Hareket', muscleGroup: 'Sirt' }),
      });

      expect(res.statusCode).toBe(201);
      const body = res.json<ExerciseItem>();
      expect(body.name).toBe('Yeni Hareket');
      expect(body.muscleGroup).toBe('Sirt');
      expect(body.isCustom).toBe(true);
      expect(body.id).toBeTruthy();
    });

    it('201 — sadece name ile (muscleGroup opsiyonel)', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/exercises',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Minimal Hareket' }),
      });

      expect(res.statusCode).toBe(201);
      const body = res.json<ExerciseItem>();
      expect(body.name).toBe('Minimal Hareket');
      expect(body.muscleGroup).toBeNull();
    });

    it('400 — name eksik ise validation hatasi', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/exercises',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ muscleGroup: 'Sirt' }),
      });

      expect(res.statusCode).toBe(400);
    });

    it('403 — member rolu custom egzersiz ekleyemez', async () => {
      const { auth } = await memberAuth();

      const res = await server.app.inject({
        method: 'POST',
        url: '/exercises',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Deneme' }),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── PUT /exercises/:id ──────────────────────────────────────────────────────

  describe('PUT /exercises/:id', () => {
    it('200 — trainer kendi customunu gunceller', async () => {
      const { trainer, auth } = await trainerAuth();
      const ex = await server.prisma.exercise.create({
        data: { name: 'Eski Isim', isCustom: true, createdById: trainer.id },
      });

      const res = await server.app.inject({
        method: 'PUT',
        url: `/exercises/${ex.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Yeni Isim', muscleGroup: 'Omuz' }),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<ExerciseItem>();
      expect(body.name).toBe('Yeni Isim');
      expect(body.muscleGroup).toBe('Omuz');
    });

    it('403 — cekirdek egzersiz duzenlenemez', async () => {
      const { auth } = await trainerAuth();
      const coreEx = await server.prisma.exercise.create({
        data: { name: 'Cekirdek Hareket', isCustom: false },
      });

      const res = await server.app.inject({
        method: 'PUT',
        url: `/exercises/${coreEx.id}`,
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Degistirildi' }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — baska trainerin customu guncellenemez', async () => {
      const { auth: authA } = await trainerAuth('+905550000001');
      const { trainer: trainerB } = await trainerAuth('+905550000002');
      const exB = await server.prisma.exercise.create({
        data: { name: 'B Custom', isCustom: true, createdById: trainerB.id },
      });

      const res = await server.app.inject({
        method: 'PUT',
        url: `/exercises/${exB.id}`,
        headers: { authorization: authA, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Deneme' }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('404 — egzersiz bulunamadi', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'PUT',
        url: '/exercises/nonexistent-id',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Deneme' }),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /exercises/:id ───────────────────────────────────────────────────

  describe('DELETE /exercises/:id', () => {
    it('204 — soft delete; sonraki GET listesinde gorunmez', async () => {
      const { trainer, auth } = await trainerAuth();
      const ex = await server.prisma.exercise.create({
        data: { name: 'Silinecek Custom', isCustom: true, createdById: trainer.id },
      });

      const deleteRes = await server.app.inject({
        method: 'DELETE',
        url: `/exercises/${ex.id}`,
        headers: { authorization: auth },
      });
      expect(deleteRes.statusCode).toBe(204);

      const listRes = await server.app.inject({
        method: 'GET',
        url: '/exercises',
        headers: { authorization: auth },
      });
      expect(listRes.statusCode).toBe(200);
      const body = listRes.json<ExerciseItem[]>();
      expect(body.find((e) => e.id === ex.id)).toBeUndefined();
    });

    it('403 — cekirdek egzersiz silinemez', async () => {
      const { auth } = await trainerAuth();
      const coreEx = await server.prisma.exercise.create({
        data: { name: 'Cekirdek Silinmez', isCustom: false },
      });

      const res = await server.app.inject({
        method: 'DELETE',
        url: `/exercises/${coreEx.id}`,
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(403);
    });

    it('403 — baska trainerin customu silinemez', async () => {
      const { auth: authA } = await trainerAuth('+905550000001');
      const { trainer: trainerB } = await trainerAuth('+905550000002');
      const exB = await server.prisma.exercise.create({
        data: { name: 'B Custom Silinmez', isCustom: true, createdById: trainerB.id },
      });

      const res = await server.app.inject({
        method: 'DELETE',
        url: `/exercises/${exB.id}`,
        headers: { authorization: authA },
      });

      expect(res.statusCode).toBe(403);
    });

    it('404 — egzersiz bulunamadi', async () => {
      const { auth } = await trainerAuth();

      const res = await server.app.inject({
        method: 'DELETE',
        url: '/exercises/nonexistent-id',
        headers: { authorization: auth },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
