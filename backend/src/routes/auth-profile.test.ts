/**
 * TASK-1.20 — POST /auth/profile integration testleri.
 *
 *   - Yeni üye: kayıt jetonu + profil → 201, accessToken, User + ConsentRecord +
 *     audit (user_created + consent_granted)
 *   - healthConsent:true → saglik_verisi ConsentRecord + healthConsentAt set
 *   - kvkkConsent:false → 403 (zorunlu rıza)
 *   - Telefon zaten kayıtlı → 409
 *   - Jeton yok → 401
 *   - Access jetonu (yanlış tip) → 401
 *   - Eksik gövde (firstName yok) → 400
 *
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts). Kayıt jetonları
 * gerçek server'ın jwt instance'ı üzerinden üretilir (OTP verify yolunu kısaltır).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { issueAccessToken, issueRegistrationToken } from '../auth/jwt.js';

interface ProfileBody {
  role: 'member' | 'trainer';
  firstName?: string;
  lastName?: string;
  kvkkConsent?: boolean;
  healthConsent?: boolean;
  gymName?: string;
  certificateNote?: string;
}

function profile(
  server: TestServer,
  authorization: string | undefined,
  body: Partial<ProfileBody>,
) {
  return server.app.inject({
    method: 'POST',
    url: '/auth/profile',
    headers: authorization === undefined ? {} : { authorization },
    payload: body,
  });
}

describe('TASK-1.20 — POST /auth/profile', () => {
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
    await server.prisma.refreshToken.deleteMany();
    await server.prisma.consentRecord.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  it('201 — new member: creates user + kvkk consent + audit, returns accessToken', async () => {
    const phone = '+905551400011';
    const regToken = issueRegistrationToken(server.app, phone);

    const res = await profile(server, `Bearer ${regToken}`, {
      role: 'member',
      firstName: 'Ada',
      lastName: 'Yıldız',
      kvkkConsent: true,
    });

    expect(res.statusCode).toBe(201);
    const json = res.json() as { accessToken: string; user: { id: string; role: string } };
    expect(typeof json.accessToken).toBe('string');
    expect(json.user.role).toBe('member');

    const dbUser = await server.prisma.user.findFirst({ where: { phoneE164: phone } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.kvkkConsentAt).not.toBeNull();
    expect(dbUser?.healthConsentAt).toBeNull();

    const kvkkConsents = await server.prisma.consentRecord.findMany({
      where: { userId: dbUser?.id, consentType: 'kvkk_aydinlatma', eventType: 'granted' },
    });
    expect(kvkkConsents).toHaveLength(1);

    const created = await server.prisma.auditLog.findMany({ where: { eventType: 'user_created' } });
    expect(created).toHaveLength(1);
    const granted = await server.prisma.auditLog.findMany({
      where: { eventType: 'consent_granted' },
    });
    expect(granted).toHaveLength(1);
  });

  it('201 — healthConsent:true grants saglik_verisi consent + sets healthConsentAt', async () => {
    const phone = '+905551400022';
    const regToken = issueRegistrationToken(server.app, phone);

    const res = await profile(server, `Bearer ${regToken}`, {
      role: 'trainer',
      firstName: 'Mert',
      lastName: 'Demir',
      kvkkConsent: true,
      healthConsent: true,
      gymName: 'Alp Spor',
    });

    expect(res.statusCode).toBe(201);
    const dbUser = await server.prisma.user.findFirst({ where: { phoneE164: phone } });
    expect(dbUser?.healthConsentAt).not.toBeNull();
    expect(dbUser?.gymName).toBe('Alp Spor');

    const health = await server.prisma.consentRecord.findMany({
      where: { userId: dbUser?.id, consentType: 'saglik_verisi', eventType: 'granted' },
    });
    expect(health).toHaveLength(1);

    const granted = await server.prisma.auditLog.findMany({
      where: { eventType: 'consent_granted' },
    });
    expect(granted).toHaveLength(2);
  });

  it('403 — kvkkConsent:false is rejected and creates no user', async () => {
    const phone = '+905551400033';
    const regToken = issueRegistrationToken(server.app, phone);

    const res = await profile(server, `Bearer ${regToken}`, {
      role: 'member',
      firstName: 'Ece',
      lastName: 'Kaya',
      kvkkConsent: false,
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ status: 'kvkk_required' });
    expect(await server.prisma.user.findFirst({ where: { phoneE164: phone } })).toBeNull();
  });

  it('409 — phone already registered (active user)', async () => {
    const phone = '+905551400044';
    await server.prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'Can', lastName: 'Acar' },
    });
    const regToken = issueRegistrationToken(server.app, phone);

    const res = await profile(server, `Bearer ${regToken}`, {
      role: 'member',
      firstName: 'Can',
      lastName: 'Acar',
      kvkkConsent: true,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ status: 'phone_taken' });
  });

  it('401 — missing registration token', async () => {
    const res = await profile(server, undefined, {
      role: 'member',
      firstName: 'Ada',
      lastName: 'Yıldız',
      kvkkConsent: true,
    });
    expect(res.statusCode).toBe(401);
  });

  it('401 — access token (wrong typ) is not accepted for profile creation', async () => {
    const helper = await server.prisma.user.create({
      data: { phoneE164: '+905551400055', role: 'member', firstName: 'Deniz', lastName: 'Ak' },
    });
    const accessToken = issueAccessToken(server.app, { id: helper.id, role: 'member' });

    const res = await profile(server, `Bearer ${accessToken}`, {
      role: 'member',
      firstName: 'Yeni',
      lastName: 'Üye',
      kvkkConsent: true,
    });
    expect(res.statusCode).toBe(401);
  });

  it('400 — missing required field (firstName)', async () => {
    const regToken = issueRegistrationToken(server.app, '+905551400066');
    const res = await profile(server, `Bearer ${regToken}`, {
      role: 'member',
      lastName: 'Yıldız',
      kvkkConsent: true,
    });
    expect(res.statusCode).toBe(400);
  });
});
