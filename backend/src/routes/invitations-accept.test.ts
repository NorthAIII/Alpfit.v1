/**
 * TASK-1.24 — POST /invitations/:code/accept integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Üye davet kabul → 200; TrainerMember aktif, Invitation accepted,
 *     AuditLog invitation_accepted (metadata PII içermez)
 *   - Aynı davet ikinci kabul → 409 (already_used)
 *   - Süresi dolmuş davet → 410 (lazy expire)
 *   - İptal edilmiş davet → 410 (cancelled)
 *   - Trainer başka PT'nin davetini kabul → 403 (role)
 *   - PT kendi davetini kabul → 400 (own_invitation, role'den önce)
 *   - Üyenin zaten aktif PT'si var → 409 (already_has_trainer)
 *   - Geçersiz kod → 404
 *   - Soft-deleted PT'nin daveti → 404
 *   - Erişim token'ı yok → 401
 *   - Eşzamanlı 2 üye aynı kodu kabul (race) → biri 200, biri 409
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken } from '../auth/jwt.js';

import type { InvitationStatus, Role } from '../generated/prisma/enums.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function acceptInvitation(server: TestServer, code: string, authorization: string | undefined) {
  return server.app.inject({
    method: 'POST',
    url: `/invitations/${code}/accept`,
    headers: authorization === undefined ? {} : { authorization },
  });
}

describe('TASK-1.24 — POST /invitations/:code/accept', () => {
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
    await server.prisma.invitation.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  function createUser(phone: string, role: Role, deleted = false) {
    return server.prisma.user.create({
      data: {
        phoneE164: phone,
        role,
        firstName: 'Ada',
        lastName: 'Yıldız',
        deletedAt: deleted ? new Date() : null,
      },
    });
  }

  function memberAuth(memberId: string) {
    return `Bearer ${issueAccessToken(server.app, { id: memberId, role: 'member' })}`;
  }

  function createInvitationRow(
    trainerId: string,
    code: string,
    status: InvitationStatus = 'pending',
    expiresAt: Date = new Date(Date.now() + 30 * DAY_MS),
  ) {
    return server.prisma.invitation.create({
      data: { code, trainerId, status, expiresAt },
    });
  }

  it('200 — member accepts; TrainerMember active, invitation accepted, audit logged', async () => {
    const trainer = await createUser('+905554300001', 'trainer');
    const member = await createUser('+905554300002', 'member');
    const inv = await createInvitationRow(trainer.id, 'ACC001');

    const res = await acceptInvitation(server, inv.code, memberAuth(member.id));
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      trainerId: string;
      trainerFirstName: string;
      trainerLastName: string;
    }>();
    expect(body.trainerId).toBe(trainer.id);
    expect(body.trainerFirstName).toBe('Ada');
    expect(body.trainerLastName).toBe('Yıldız');

    // Invitation accepted + acceptedByUserId set.
    const row = await server.prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(row?.status).toBe('accepted');
    expect(row?.acceptedByUserId).toBe(member.id);
    expect(row?.acceptedAt).not.toBeNull();

    // Aktif TrainerMember ilişkisi kuruldu.
    const relation = await server.prisma.trainerMember.findFirst({
      where: { memberId: member.id, endedAt: null },
    });
    expect(relation?.trainerId).toBe(trainer.id);

    // Audit event yazıldı, metadata yalnızca invitationId (PII yok).
    const audit = await server.prisma.auditLog.findMany({
      where: { eventType: 'invitation_accepted' },
    });
    expect(audit).toHaveLength(1);
    const metadata = audit[0]?.metadata as Record<string, unknown>;
    expect(metadata['invitationId']).toBe(inv.id);
    expect(JSON.stringify(metadata)).not.toContain('905554');
    expect(JSON.stringify(metadata)).not.toContain(member.id);
  });

  it('409 — second accept of the same invitation (already used)', async () => {
    const trainer = await createUser('+905554300010', 'trainer');
    const member1 = await createUser('+905554300011', 'member');
    const member2 = await createUser('+905554300012', 'member');
    const inv = await createInvitationRow(trainer.id, 'ACC010');

    const first = await acceptInvitation(server, inv.code, memberAuth(member1.id));
    expect(first.statusCode).toBe(200);

    const second = await acceptInvitation(server, inv.code, memberAuth(member2.id));
    expect(second.statusCode).toBe(409);
    expect(second.json<{ status: string }>().status).toBe('already_used');
  });

  it('410 — expired invitation is lazily marked expired', async () => {
    const trainer = await createUser('+905554300020', 'trainer');
    const member = await createUser('+905554300021', 'member');
    const inv = await createInvitationRow(
      trainer.id,
      'ACC020',
      'pending',
      new Date(Date.now() - DAY_MS),
    );

    const res = await acceptInvitation(server, inv.code, memberAuth(member.id));
    expect(res.statusCode).toBe(410);
    expect(res.json<{ status: string }>().status).toBe('expired');

    const row = await server.prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(row?.status).toBe('expired');
  });

  it('410 — cancelled invitation', async () => {
    const trainer = await createUser('+905554300030', 'trainer');
    const member = await createUser('+905554300031', 'member');
    const inv = await createInvitationRow(trainer.id, 'ACC030', 'cancelled');

    const res = await acceptInvitation(server, inv.code, memberAuth(member.id));
    expect(res.statusCode).toBe(410);
    expect(res.json<{ status: string }>().status).toBe('cancelled');
  });

  it('403 — trainer cannot accept another trainer’s invitation (role)', async () => {
    const trainerA = await createUser('+905554300040', 'trainer');
    const trainerB = await createUser('+905554300041', 'trainer');
    const inv = await createInvitationRow(trainerA.id, 'ACC040');

    const auth = `Bearer ${issueAccessToken(server.app, { id: trainerB.id, role: 'trainer' })}`;
    const res = await acceptInvitation(server, inv.code, auth);
    expect(res.statusCode).toBe(403);
    expect(res.json<{ status: string }>().status).toBe('forbidden');
  });

  it('400 — trainer cannot accept own invitation (checked before role)', async () => {
    const trainer = await createUser('+905554300050', 'trainer');
    const inv = await createInvitationRow(trainer.id, 'ACC050');

    const auth = `Bearer ${issueAccessToken(server.app, { id: trainer.id, role: 'trainer' })}`;
    const res = await acceptInvitation(server, inv.code, auth);
    expect(res.statusCode).toBe(400);
    expect(res.json<{ status: string }>().status).toBe('own_invitation');
  });

  it('409 — member already has an active trainer', async () => {
    const trainerA = await createUser('+905554300060', 'trainer');
    const trainerB = await createUser('+905554300061', 'trainer');
    const member = await createUser('+905554300062', 'member');
    // Üye zaten PT-A'ya bağlı.
    await server.prisma.trainerMember.create({
      data: { trainerId: trainerA.id, memberId: member.id },
    });
    const inv = await createInvitationRow(trainerB.id, 'ACC060');

    const res = await acceptInvitation(server, inv.code, memberAuth(member.id));
    expect(res.statusCode).toBe(409);
    expect(res.json<{ status: string }>().status).toBe('already_has_trainer');

    // Davet pending kaldı (kabul edilmedi).
    const row = await server.prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(row?.status).toBe('pending');
  });

  it('404 — invalid code', async () => {
    const member = await createUser('+905554300070', 'member');
    const res = await acceptInvitation(server, 'ZZZ999', memberAuth(member.id));
    expect(res.statusCode).toBe(404);
  });

  it('404 — invitation of a soft-deleted trainer is treated as invalid', async () => {
    const trainer = await createUser('+905554300080', 'trainer', true);
    const member = await createUser('+905554300081', 'member');
    const inv = await createInvitationRow(trainer.id, 'ACC080');

    const res = await acceptInvitation(server, inv.code, memberAuth(member.id));
    expect(res.statusCode).toBe(404);
  });

  it('401 — without access token', async () => {
    const trainer = await createUser('+905554300090', 'trainer');
    const inv = await createInvitationRow(trainer.id, 'ACC090');
    const res = await acceptInvitation(server, inv.code, undefined);
    expect(res.statusCode).toBe(401);
  });

  it('race — two members accept the same code; exactly one 200, one 409', async () => {
    const trainer = await createUser('+905554300100', 'trainer');
    const member1 = await createUser('+905554300101', 'member');
    const member2 = await createUser('+905554300102', 'member');
    const inv = await createInvitationRow(trainer.id, 'ACC100');

    const [r1, r2] = await Promise.all([
      acceptInvitation(server, inv.code, memberAuth(member1.id)),
      acceptInvitation(server, inv.code, memberAuth(member2.id)),
    ]);

    const statuses = [r1.statusCode, r2.statusCode].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);

    // Yalnızca bir aktif TrainerMember ilişkisi var.
    const activeCount = await server.prisma.trainerMember.count({
      where: { trainerId: trainer.id, endedAt: null },
    });
    expect(activeCount).toBe(1);

    const row = await server.prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(row?.status).toBe('accepted');
  });
});
