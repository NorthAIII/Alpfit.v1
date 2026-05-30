/**
 * TASK-1.31 — GET /trainers/me/members integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Trainer aktif üyelerini döner (id + isim + joinedAt), en yeni önce
 *   - Üyesi olmayan trainer → boş dizi
 *   - Sonlanmış ilişki (endedAt set) listeden düşer
 *   - Soft-deleted üye listeden düşer
 *   - Başka trainer'ın üyeleri sızmaz
 *   - Member rolü → 403 (ensureTrainer)
 *   - Access token yok → 401 (middleware)
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
}

function getMembers(server: TestServer, authorization: string | undefined) {
  return server.app.inject({
    method: 'GET',
    url: '/trainers/me/members',
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('TASK-1.31 — GET /trainers/me/members', () => {
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
    await server.prisma.trainerMember.deleteMany();
    await server.prisma.user.deleteMany();
  });

  function createUser(phone: string, role: Role, firstName = 'Ada', lastName = 'Yıldız') {
    return server.prisma.user.create({ data: { phoneE164: phone, role, firstName, lastName } });
  }

  async function trainerAuth(phone = '+905554300001') {
    const trainer = await createUser(phone, 'trainer', 'Mehmet', 'Demir');
    return {
      trainer,
      auth: `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`,
    };
  }

  it('200 — trainer’s active members, newest first', async () => {
    const { trainer, auth } = await trainerAuth();
    const older = await createUser('+905554300010', 'member', 'Ayşe', 'Kaya');
    const newer = await createUser('+905554300011', 'member', 'Zeynep', 'Ak');
    await server.prisma.trainerMember.create({
      data: {
        trainerId: trainer.id,
        memberId: older.id,
        startedAt: new Date('2026-05-01T00:00:00Z'),
      },
    });
    await server.prisma.trainerMember.create({
      data: {
        trainerId: trainer.id,
        memberId: newer.id,
        startedAt: new Date('2026-05-20T00:00:00Z'),
      },
    });

    const res = await getMembers(server, auth);
    expect(res.statusCode).toBe(200);
    const body = res.json<MemberItem[]>();
    expect(body).toHaveLength(2);
    // En yeni (Zeynep) önce.
    expect(body[0]?.firstName).toBe('Zeynep');
    expect(body[0]?.id).toBe(newer.id);
    expect(body[1]?.firstName).toBe('Ayşe');
    expect(typeof body[0]?.joinedAt).toBe('string');
    // Telefon/sağlık verisi DÖNMEZ.
    expect(JSON.stringify(body)).not.toContain('905554300010');
  });

  it('200 — empty array when trainer has no members', async () => {
    const { auth } = await trainerAuth();
    const res = await getMembers(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<MemberItem[]>()).toHaveLength(0);
  });

  it('200 — ended relation (endedAt set) is excluded', async () => {
    const { trainer, auth } = await trainerAuth();
    const member = await createUser('+905554300020', 'member', 'Ali', 'Veli');
    await server.prisma.trainerMember.create({
      data: { trainerId: trainer.id, memberId: member.id, endedAt: new Date() },
    });

    const res = await getMembers(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<MemberItem[]>()).toHaveLength(0);
  });

  it('200 — soft-deleted member is excluded', async () => {
    const { trainer, auth } = await trainerAuth();
    const member = await createUser('+905554300030', 'member', 'Can', 'Su');
    await server.prisma.trainerMember.create({
      data: { trainerId: trainer.id, memberId: member.id },
    });
    await server.prisma.user.update({
      where: { id: member.id },
      data: { deletedAt: new Date() },
    });

    const res = await getMembers(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<MemberItem[]>()).toHaveLength(0);
  });

  it('200 — does not leak another trainer’s members', async () => {
    const { trainer: trainerA, auth: authA } = await trainerAuth('+905554300040');
    const { trainer: trainerB } = await trainerAuth('+905554300041');
    const memberA = await createUser('+905554300050', 'member', 'Deniz', 'Yel');
    const memberB = await createUser('+905554300051', 'member', 'Ece', 'Gün');
    await server.prisma.trainerMember.create({
      data: { trainerId: trainerA.id, memberId: memberA.id },
    });
    await server.prisma.trainerMember.create({
      data: { trainerId: trainerB.id, memberId: memberB.id },
    });

    const res = await getMembers(server, authA);
    expect(res.statusCode).toBe(200);
    const body = res.json<MemberItem[]>();
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(memberA.id);
  });

  it('403 — member role cannot list members', async () => {
    const member = await createUser('+905554300060', 'member');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    const res = await getMembers(server, auth);
    expect(res.statusCode).toBe(403);
  });

  it('401 — without access token', async () => {
    const res = await getMembers(server, undefined);
    expect(res.statusCode).toBe(401);
  });
});
