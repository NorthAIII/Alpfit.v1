/**
 * TASK-1.32 — GET /trainers/me/events integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Trainer'ın kendi `invitation_accepted` event'lerini döner (en yeni önce)
 *   - `since` filtresi: o zamandan SONRA başlayanlar (strict >) gelir, öncekiler düşer
 *   - `since` yok → tüm aktif ilişkiler event olarak gelir
 *   - Başka trainer'ın event'leri sızmaz
 *   - Soft-deleted üye event'i düşer
 *   - Geçersiz `since` → 400
 *   - Member rolü → 403 (ensureTrainer)
 *   - Access token yok → 401 (middleware)
 *
 * Kaynak: event'ler `TrainerMember`'dan üretilir (DECISIONS.md TASK-1.32);
 * `memberFirstName` döner ama telefon DÖNMEZ (PII assert).
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { Role } from '../generated/prisma/enums.js';

interface EventItem {
  type: string;
  memberId: string;
  memberFirstName: string;
  occurredAt: string;
}

function getEvents(server: TestServer, authorization: string | undefined, since?: string) {
  const query = since === undefined ? '' : `?since=${encodeURIComponent(since)}`;
  return server.app.inject({
    method: 'GET',
    url: `/trainers/me/events${query}`,
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('TASK-1.32 — GET /trainers/me/events', () => {
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

  async function trainerAuth(phone = '+905554320001') {
    const trainer = await createUser(phone, 'trainer', 'Mehmet', 'Demir');
    return {
      trainer,
      auth: `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`,
    };
  }

  function joinMember(trainerId: string, memberId: string, startedAt: Date) {
    return server.prisma.trainerMember.create({ data: { trainerId, memberId, startedAt } });
  }

  it('200 — trainer’s accepted-invite events, newest first', async () => {
    const { trainer, auth } = await trainerAuth();
    const older = await createUser('+905554320010', 'member', 'Ayşe', 'Kaya');
    const newer = await createUser('+905554320011', 'member', 'Zeynep', 'Ak');
    await joinMember(trainer.id, older.id, new Date('2026-05-01T00:00:00Z'));
    await joinMember(trainer.id, newer.id, new Date('2026-05-20T00:00:00Z'));

    const res = await getEvents(server, auth);
    expect(res.statusCode).toBe(200);
    const body = res.json<EventItem[]>();
    expect(body).toHaveLength(2);
    expect(body[0]?.type).toBe('invitation_accepted');
    expect(body[0]?.memberFirstName).toBe('Zeynep');
    expect(body[0]?.memberId).toBe(newer.id);
    expect(body[1]?.memberFirstName).toBe('Ayşe');
    // Telefon DÖNMEZ.
    expect(JSON.stringify(body)).not.toContain('905554320010');
  });

  it('200 — since filter returns only events strictly after the cursor', async () => {
    const { trainer, auth } = await trainerAuth();
    const before = await createUser('+905554320020', 'member', 'Ali', 'Veli');
    const after = await createUser('+905554320021', 'member', 'Can', 'Su');
    await joinMember(trainer.id, before.id, new Date('2026-05-10T00:00:00Z'));
    await joinMember(trainer.id, after.id, new Date('2026-05-15T00:00:00Z'));

    const res = await getEvents(server, auth, '2026-05-12T00:00:00.000Z');
    expect(res.statusCode).toBe(200);
    const body = res.json<EventItem[]>();
    expect(body).toHaveLength(1);
    expect(body[0]?.memberId).toBe(after.id);
  });

  it('200 — without since returns all active relations', async () => {
    const { trainer, auth } = await trainerAuth();
    const m1 = await createUser('+905554320030', 'member', 'Ece', 'Gün');
    await joinMember(trainer.id, m1.id, new Date('2026-05-01T00:00:00Z'));

    const res = await getEvents(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<EventItem[]>()).toHaveLength(1);
  });

  it('200 — does not leak another trainer’s events', async () => {
    const { trainer: trainerA, auth: authA } = await trainerAuth('+905554320040');
    const { trainer: trainerB } = await trainerAuth('+905554320041');
    const memberA = await createUser('+905554320050', 'member', 'Deniz', 'Yel');
    const memberB = await createUser('+905554320051', 'member', 'Naz', 'Işık');
    await joinMember(trainerA.id, memberA.id, new Date('2026-05-05T00:00:00Z'));
    await joinMember(trainerB.id, memberB.id, new Date('2026-05-06T00:00:00Z'));

    const res = await getEvents(server, authA);
    expect(res.statusCode).toBe(200);
    const body = res.json<EventItem[]>();
    expect(body).toHaveLength(1);
    expect(body[0]?.memberId).toBe(memberA.id);
  });

  it('200 — soft-deleted member event is excluded', async () => {
    const { trainer, auth } = await trainerAuth();
    const member = await createUser('+905554320060', 'member', 'Su', 'Akar');
    await joinMember(trainer.id, member.id, new Date('2026-05-07T00:00:00Z'));
    await server.prisma.user.update({
      where: { id: member.id },
      data: { deletedAt: new Date() },
    });

    const res = await getEvents(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<EventItem[]>()).toHaveLength(0);
  });

  it('400 — invalid since timestamp', async () => {
    const { auth } = await trainerAuth();
    const res = await getEvents(server, auth, 'not-a-date');
    expect(res.statusCode).toBe(400);
  });

  it('403 — member role cannot list events', async () => {
    const member = await createUser('+905554320070', 'member');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    const res = await getEvents(server, auth);
    expect(res.statusCode).toBe(403);
  });

  it('401 — without access token', async () => {
    const res = await getEvents(server, undefined);
    expect(res.statusCode).toBe(401);
  });
});
