/**
 * TASK-1.24 — GET /invitations/:code (preview, public) integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Geçerli davet preview → 200 + PT ad/soyad + expiresAt (auth gerekmez)
 *   - Süresi dolmuş davet → 410 { status: 'expired' } (lazy expire)
 *   - İptal edilmiş davet → 410 { status: 'cancelled' }
 *   - Kabul edilmiş davet → 410 { status: 'accepted' }
 *   - Geçersiz kod → 404
 *   - Soft-deleted PT'nin daveti → 404
 *   - PII: telefon/üye verisi response'a sızmaz
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';

import type { InvitationStatus, Role } from '../generated/prisma/enums.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function previewInvitation(server: TestServer, code: string) {
  return server.app.inject({ method: 'GET', url: `/invitations/${code}` });
}

describe('TASK-1.24 — GET /invitations/:code (preview)', () => {
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
    await server.prisma.invitation.deleteMany();
    await server.prisma.user.deleteMany();
  });

  function createTrainer(phone: string, deleted = false) {
    return server.prisma.user.create({
      data: {
        phoneE164: phone,
        role: 'trainer' as Role,
        firstName: 'Mehmet',
        lastName: 'Demir',
        deletedAt: deleted ? new Date() : null,
      },
    });
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

  it('200 — valid invitation preview returns trainer name + expiresAt (no auth)', async () => {
    const trainer = await createTrainer('+905554400001');
    const inv = await createInvitationRow(trainer.id, 'PRV001');

    const res = await previewInvitation(server, inv.code);
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      trainerFirstName: string;
      trainerLastName: string;
      expiresAt: string;
    }>();
    expect(body.trainerFirstName).toBe('Mehmet');
    expect(body.trainerLastName).toBe('Demir');
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    // Telefon PII sızmaz.
    expect(JSON.stringify(body)).not.toContain('905554');
  });

  it('410 — expired invitation preview is lazily marked expired', async () => {
    const trainer = await createTrainer('+905554400010');
    const inv = await createInvitationRow(
      trainer.id,
      'PRV010',
      'pending',
      new Date(Date.now() - DAY_MS),
    );

    const res = await previewInvitation(server, inv.code);
    expect(res.statusCode).toBe(410);
    expect(res.json<{ status: string }>().status).toBe('expired');

    const row = await server.prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(row?.status).toBe('expired');
  });

  it('410 — cancelled invitation preview', async () => {
    const trainer = await createTrainer('+905554400020');
    const inv = await createInvitationRow(trainer.id, 'PRV020', 'cancelled');

    const res = await previewInvitation(server, inv.code);
    expect(res.statusCode).toBe(410);
    expect(res.json<{ status: string }>().status).toBe('cancelled');
  });

  it('410 — accepted invitation preview', async () => {
    const trainer = await createTrainer('+905554400030');
    const inv = await createInvitationRow(trainer.id, 'PRV030', 'accepted');

    const res = await previewInvitation(server, inv.code);
    expect(res.statusCode).toBe(410);
    expect(res.json<{ status: string }>().status).toBe('accepted');
  });

  it('404 — invalid code', async () => {
    const res = await previewInvitation(server, 'ZZZ999');
    expect(res.statusCode).toBe(404);
  });

  it('404 — invitation of a soft-deleted trainer', async () => {
    const trainer = await createTrainer('+905554400040', true);
    const inv = await createInvitationRow(trainer.id, 'PRV040');

    const res = await previewInvitation(server, inv.code);
    expect(res.statusCode).toBe(404);
  });
});
