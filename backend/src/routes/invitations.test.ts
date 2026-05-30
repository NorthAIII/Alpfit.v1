/**
 * TASK-1.23 — /invitations (create + list + cancel) integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - PT create → 201, kod 6 char Crockford base32, url `${base}/davet/{code}`
 *   - Member rolü create → 403 (trainer-only guard)
 *   - Access token yok → 401 (middleware)
 *   - GET list bekleyen davetleri döner; 30 gün geçmiş davet lazy `expired`'a
 *     çekilir ve listeden düşer
 *   - Pending davet cancel → 204; başka PT'nin daveti → 403; accepted → 409
 *   - Aynı PT 5 davet üretir, hepsi list'te
 *   - Kod çakışmasında (P2002) create retry yeni kodla başarılı olur
 *   - generateInvitationCode 1000 üretimde çakışmaz + alfabe doğru
 *   - AuditLog invitation_created metadata PII içermez (yalnızca invitationId)
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';
import * as codeModule from '../invitations/code.js';

import type { Role } from '../generated/prisma/enums.js';

/** Crockford base32 (I/L/O/U yok) — 6 karakter. */
const CODE_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

function createInvitation(server: TestServer, authorization: string | undefined) {
  return server.app.inject({
    method: 'POST',
    url: '/invitations',
    headers: authorization === undefined ? {} : { authorization },
  });
}

function listInvitations(server: TestServer, authorization: string) {
  return server.app.inject({
    method: 'GET',
    url: '/invitations',
    headers: { authorization },
  });
}

function cancelInvitation(server: TestServer, id: string, authorization: string) {
  return server.app.inject({
    method: 'DELETE',
    url: `/invitations/${id}`,
    headers: { authorization },
  });
}

describe('TASK-1.23 — /invitations', () => {
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
    vi.restoreAllMocks();
    await server.prisma.invitation.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  function createUser(phone: string, role: Role) {
    return server.prisma.user.create({
      data: { phoneE164: phone, role, firstName: 'Ada', lastName: 'Yıldız' },
    });
  }

  async function trainerAuth(phone = '+905554200001') {
    const trainer = await createUser(phone, 'trainer');
    return {
      trainer,
      auth: `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`,
    };
  }

  it('201 — trainer creates invitation; 6-char code, davet url, 30-day expiry', async () => {
    const { auth } = await trainerAuth();
    const res = await createInvitation(server, auth);
    expect(res.statusCode).toBe(201);

    const body = res.json<{ id: string; code: string; url: string; expiresAt: string }>();
    expect(body.code).toMatch(CODE_RE);
    expect(body.url).toBe(`https://alpfit.app/davet/${body.code}`);

    // ~30 gün sonrası (±1 dk tolerans).
    const ttlMs = new Date(body.expiresAt).getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(29.9 * 24 * 60 * 60 * 1000);
    expect(ttlMs).toBeLessThan(30.1 * 24 * 60 * 60 * 1000);

    const row = await server.prisma.invitation.findUnique({ where: { id: body.id } });
    expect(row?.status).toBe('pending');
  });

  it('201 — audit invitation_created has only invitationId metadata (no PII)', async () => {
    const { auth } = await trainerAuth();
    const res = await createInvitation(server, auth);
    const body = res.json<{ id: string; code: string }>();

    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'invitation_created' },
    });
    expect(audit).toHaveLength(1);
    const metadata = audit[0]?.metadata as Record<string, unknown>;
    expect(metadata['invitationId']).toBe(body.id);
    // Kod ve telefon audit'e YAZILMAZ (PII/log şişirme koruması).
    expect(JSON.stringify(metadata)).not.toContain(body.code);
    expect(JSON.stringify(metadata)).not.toContain('905554');
  });

  it('403 — member role cannot create invitation', async () => {
    const member = await createUser('+905554200002', 'member');
    const auth = `Bearer ${issueAccessToken(server.app, { id: member.id, role: 'member' })}`;
    const res = await createInvitation(server, auth);
    expect(res.statusCode).toBe(403);
  });

  it('401 — without access token', async () => {
    const res = await createInvitation(server, undefined);
    expect(res.statusCode).toBe(401);
  });

  it('200 — list returns all 5 pending invitations for the trainer', async () => {
    const { auth } = await trainerAuth();
    for (let i = 0; i < 5; i += 1) {
      const r = await createInvitation(server, auth);
      expect(r.statusCode).toBe(201);
    }

    const res = await listInvitations(server, auth);
    expect(res.statusCode).toBe(200);
    const list = res.json<{ id: string; code: string; url: string }[]>();
    expect(list).toHaveLength(5);
    expect(list.every((i) => CODE_RE.test(i.code))).toBe(true);
    expect(list.every((i) => i.url === `https://alpfit.app/davet/${i.code}`)).toBe(true);
  });

  it('200 — list does not leak another trainer’s invitations', async () => {
    const { auth: authA } = await trainerAuth('+905554200010');
    const { auth: authB } = await trainerAuth('+905554200011');
    await createInvitation(server, authA);
    await createInvitation(server, authB);

    const listA = (await listInvitations(server, authA)).json<unknown[]>();
    expect(listA).toHaveLength(1);
  });

  it('200 — expired invitation is lazily marked expired and dropped from list', async () => {
    const { trainer, auth } = await trainerAuth();
    // Süresi 1 gün önce dolmuş bir davet doğrudan DB'ye yaz.
    const stale = await server.prisma.invitation.create({
      data: {
        code: 'ABC234',
        trainerId: trainer.id,
        status: 'pending',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await listInvitations(server, auth);
    expect(res.statusCode).toBe(200);
    expect(res.json<unknown[]>()).toHaveLength(0);

    // Lazy expiry: DB'de status artık expired.
    const row = await server.prisma.invitation.findUnique({ where: { id: stale.id } });
    expect(row?.status).toBe('expired');
  });

  it('204 — trainer cancels own pending invitation', async () => {
    const { auth } = await trainerAuth();
    const created = (await createInvitation(server, auth)).json<{ id: string }>();

    const res = await cancelInvitation(server, created.id, auth);
    expect(res.statusCode).toBe(204);

    const row = await server.prisma.invitation.findUnique({ where: { id: created.id } });
    expect(row?.status).toBe('cancelled');
    expect(row?.cancelledAt).not.toBeNull();
  });

  it('403 — trainer cannot cancel another trainer’s invitation', async () => {
    const { auth: authA } = await trainerAuth('+905554200020');
    const { auth: authB } = await trainerAuth('+905554200021');
    const created = (await createInvitation(server, authA)).json<{ id: string }>();

    const res = await cancelInvitation(server, created.id, authB);
    expect(res.statusCode).toBe(403);

    const row = await server.prisma.invitation.findUnique({ where: { id: created.id } });
    expect(row?.status).toBe('pending');
  });

  it('409 — cannot cancel an already-accepted invitation', async () => {
    const { trainer, auth } = await trainerAuth();
    const accepted = await server.prisma.invitation.create({
      data: {
        code: 'XYZ789',
        trainerId: trainer.id,
        status: 'accepted',
        acceptedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const res = await cancelInvitation(server, accepted.id, auth);
    expect(res.statusCode).toBe(409);
  });

  it('404 — cancel a non-existent invitation', async () => {
    const { auth } = await trainerAuth();
    const res = await cancelInvitation(server, 'cuid-does-not-exist', auth);
    expect(res.statusCode).toBe(404);
  });

  it('201 — create retries on code collision and succeeds with a fresh code', async () => {
    const { trainer, auth } = await trainerAuth();
    // Var olan bir kodla çakışma yarat: önce 'AAAAAA' davetini DB'ye koy.
    await server.prisma.invitation.create({
      data: {
        code: 'AAAAAA',
        trainerId: trainer.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    // İlk üretim çakışan kodu, ikinci üretim taze kodu döner.
    const spy = vi
      .spyOn(codeModule, 'generateInvitationCode')
      .mockReturnValueOnce('AAAAAA')
      .mockReturnValueOnce('BBBBBB');

    const res = await createInvitation(server, auth);
    expect(res.statusCode).toBe(201);
    expect(res.json<{ code: string }>().code).toBe('BBBBBB');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('generates 1000 unique 6-char Crockford base32 codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const code = codeModule.generateInvitationCode();
      expect(code).toMatch(CODE_RE);
      codes.add(code);
    }
    expect(codes.size).toBe(1000);
  });
});
