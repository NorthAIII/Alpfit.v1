/**
 * TASK-1.34 — M0 + M1 uçtan uca onboarding smoke testi (backend bütünsel).
 *
 * Tek tek route testleri (auth-otp-*, auth-profile, invitations-*, trainers-*)
 * her endpoint'i izole doğrular; bu suite onları **gerçek HTTP akışında zincirler**
 * — faz milestone'unun ("PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT
 * davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır") bütünsel
 * doğrulayıcısıdır. Hiçbir adım kısa devre yapılmaz (jeton/kod hep önceki adımın
 * çıktısından gelir); kod `dev_otp_log`'tan okunur (MockSmsProvider, SMS_PROVIDER=mock).
 *
 * Senaryolar:
 *   A. PT akışı uçtan uca: send → verify → profile(trainer) → invitations;
 *      AuditLog'da otp_sent, otp_verified, user_created, consent_granted,
 *      invitation_created event'leri yazılı.
 *   B. Üye akışı + davet kabul: preview → send → verify → profile(member) →
 *      accept; PT'nin /trainers/me/members + /trainers/me/events sonucunda üye
 *      görünür (invitation_accepted).
 *   C. Replay: PT refresh token rotate edilir; eski token tekrar → 401 replay,
 *      yeni token de aile iptaliyle 401.
 *   D. Brute force: send + 5 hatalı verify → 423 lockout; doğru kod hâlâ 423.
 *
 * E2E (Maestro) Yakın 5'te; bu task integration-level (backend bütünsel) kapsam.
 * Per-suite Postgres (db.ts) + per-suite Redis (redis.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../db.js';

import type { AuditEventType, Role } from '../../src/generated/prisma/enums.js';
import type { InjectOptions } from 'fastify';

// Her senaryo AYRI telefon kullanır: OTP send slot'u Redis'te 60sn TTL ile tutulur
// (per-suite keyPrefix temizlenmez), aynı numara tekrar gönderimde 429 alır. Ayrı
// numara = senaryolar arası izolasyon (auth-otp-verify.test.ts ile aynı disiplin).
const PT_PHONE_A = '+905554340001';
const PT_PHONE_B = '+905554340002';
const MEMBER_PHONE_B = '+905554340003';
const PT_PHONE_C = '+905554340004';
const MEMBER_PHONE_D = '+905554340005';

interface OnboardResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

describe('TASK-1.34 — onboarding uçtan uca smoke', () => {
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
    // Sıralı FK güvenli temizlik — her senaryo izole başlar.
    await server.prisma.devOtpLog.deleteMany();
    await server.prisma.refreshToken.deleteMany();
    await server.prisma.consentRecord.deleteMany();
    await server.prisma.invitation.deleteMany();
    await server.prisma.trainerMember.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.user.deleteMany();
  });

  // --- HTTP akış yardımcıları (gerçek endpoint'ler — kısa devre yok) ------------

  function post(url: string, payload?: unknown, authorization?: string) {
    const opts: InjectOptions = { method: 'POST', url };
    if (payload !== undefined) {
      opts.payload = payload as Exclude<InjectOptions['payload'], undefined>;
    }
    if (authorization !== undefined) {
      opts.headers = { authorization };
    }
    return server.app.inject(opts);
  }

  function get(url: string, authorization?: string) {
    const opts: InjectOptions = { method: 'GET', url };
    if (authorization !== undefined) {
      opts.headers = { authorization };
    }
    return server.app.inject(opts);
  }

  /** Mock SMS provider'ın `dev_otp_log`'a yazdığı son (tüketilmemiş) kodu okur. */
  async function readOtpCode(phone: string): Promise<string> {
    const row = await server.prisma.devOtpLog.findFirst({
      where: { phoneE164: phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    });
    if (row === null) {
      throw new Error(`dev_otp_log boş: ${phone} için OTP üretilmedi`);
    }
    return row.code;
  }

  /** send → verify → profile zinciriyle yeni hesap açar; oturum jetonlarını döner. */
  async function onboard(phone: string, role: Role): Promise<OnboardResult> {
    const send = await post('/auth/otp/send', { phone });
    expect(send.statusCode).toBe(200);

    const code = await readOtpCode(phone);
    const verify = await post('/auth/otp/verify', { phone, code });
    expect(verify.statusCode).toBe(200);
    const verifyBody = verify.json<{ isNew: boolean; registrationToken?: string }>();
    expect(verifyBody.isNew).toBe(true);
    expect(verifyBody.registrationToken).toBeTypeOf('string');

    const profile = await post(
      '/auth/profile',
      { role, firstName: 'Ada', lastName: 'Yıldız', kvkkConsent: true },
      `Bearer ${verifyBody.registrationToken}`,
    );
    expect(profile.statusCode).toBe(201);
    const profileBody = profile.json<{
      accessToken: string;
      refreshToken: string;
      user: { id: string };
    }>();
    return {
      accessToken: profileBody.accessToken,
      refreshToken: profileBody.refreshToken,
      userId: profileBody.user.id,
    };
  }

  function auditTypes(rows: { eventType: AuditEventType }[]): AuditEventType[] {
    return rows.map((r) => r.eventType);
  }

  // --- Senaryo A: PT akışı uçtan uca -------------------------------------------

  it('A — PT: send → verify → profile → invitations; audit zinciri yazılı', async () => {
    const pt = await onboard(PT_PHONE_A, 'trainer');

    const create = await post('/invitations', undefined, `Bearer ${pt.accessToken}`);
    expect(create.statusCode).toBe(201);
    const invite = create.json<{ code: string; url: string }>();
    expect(invite.code).toMatch(/^[0-9A-Z]{6}$/);
    expect(invite.url).toContain(invite.code);

    // Davet DB'de pending + PT'ye bağlı.
    const row = await server.prisma.invitation.findUnique({ where: { code: invite.code } });
    expect(row?.status).toBe('pending');
    expect(row?.trainerId).toBe(pt.userId);

    // Akışın her adımı bir KVKK audit event'i bıraktı (append-only).
    const events = auditTypes(
      await server.prisma.auditLog.findMany({ select: { eventType: true } }),
    );
    expect(events).toContain('otp_sent');
    expect(events).toContain('otp_verified');
    expect(events).toContain('user_created');
    expect(events).toContain('consent_granted');
    expect(events).toContain('invitation_created');
  });

  // --- Senaryo B: Üye akışı + davet kabul --------------------------------------

  it('B — üye: preview → onboarding → accept; PT üyeyi listede + event görür', async () => {
    const pt = await onboard(PT_PHONE_B, 'trainer');
    const create = await post('/invitations', undefined, `Bearer ${pt.accessToken}`);
    const { code } = create.json<{ code: string }>();

    // Üye davet linkine tıklar → public preview PT ismini verir.
    const preview = await get(`/invitations/${code}`);
    expect(preview.statusCode).toBe(200);
    expect(preview.json<{ trainerFirstName: string }>().trainerFirstName).toBe('Ada');

    // Üye onboarding + davet kabul.
    const since = new Date(Date.now() - 1000).toISOString();
    const member = await onboard(MEMBER_PHONE_B, 'member');
    const accept = await post(
      `/invitations/${code}/accept`,
      undefined,
      `Bearer ${member.accessToken}`,
    );
    expect(accept.statusCode).toBe(200);
    expect(accept.json<{ trainerId: string }>().trainerId).toBe(pt.userId);

    // PT artık üyeyi aktif listede görür.
    const members = await get('/trainers/me/members', `Bearer ${pt.accessToken}`);
    expect(members.statusCode).toBe(200);
    const list = members.json<{ id: string }[]>();
    expect(list.map((m) => m.id)).toContain(member.userId);

    // In-app event akışında davet kabulü görünür (since'ten sonra).
    const eventsRes = await get(
      `/trainers/me/events?since=${encodeURIComponent(since)}`,
      `Bearer ${pt.accessToken}`,
    );
    expect(eventsRes.statusCode).toBe(200);
    const ptEvents = eventsRes.json<{ type: string; memberId: string }[]>();
    expect(ptEvents).toHaveLength(1);
    expect(ptEvents[0]).toMatchObject({ type: 'invitation_accepted', memberId: member.userId });
  });

  // --- Senaryo C: Refresh token replay -----------------------------------------

  it('C — replay: rotate edilen eski token tekrar → 401, aile iptal', async () => {
    const pt = await onboard(PT_PHONE_C, 'trainer');

    // İlk rotation: rt1 → rt2.
    const rotate = await post('/auth/refresh', { refreshToken: pt.refreshToken });
    expect(rotate.statusCode).toBe(200);
    const rt2 = rotate.json<{ refreshToken: string }>().refreshToken;

    // Eski token (rt1) yeniden kullanımı → replay → 401, aile iptal edilir.
    const replay = await post('/auth/refresh', { refreshToken: pt.refreshToken });
    expect(replay.statusCode).toBe(401);
    expect(replay.json<{ status: string }>().status).toBe('replay');

    // Aile iptal edildi: yeni token (rt2) da artık çalışmaz.
    const afterRevoke = await post('/auth/refresh', { refreshToken: rt2 });
    expect(afterRevoke.statusCode).toBe(401);

    const replayAudit = await server.prisma.auditLog.findMany({
      where: { eventType: 'refresh_replay_detected' },
    });
    expect(replayAudit.length).toBeGreaterThanOrEqual(1);
  });

  // --- Senaryo D: Brute force lockout ------------------------------------------

  it('D — brute force: 5 hatalı verify → 423; doğru kod hâlâ 423', async () => {
    const send = await post('/auth/otp/send', { phone: MEMBER_PHONE_D });
    expect(send.statusCode).toBe(200);
    const realCode = await readOtpCode(MEMBER_PHONE_D);
    // Gerçek koddan farklı, sabit yanlış kod (çakışma ihtimali sıfır).
    const wrong = realCode === '000000' ? '111111' : '000000';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await post('/auth/otp/verify', { phone: MEMBER_PHONE_D, code: wrong });
      expect(res.statusCode).toBe(401);
    }
    // 5. hatalı deneme kilidi tetikler.
    const fifth = await post('/auth/otp/verify', { phone: MEMBER_PHONE_D, code: wrong });
    expect(fifth.statusCode).toBe(423);

    // Kilit aktifken doğru kod bile reddedilir (kilit kod kontrolünden önce).
    const correct = await post('/auth/otp/verify', { phone: MEMBER_PHONE_D, code: realCode });
    expect(correct.statusCode).toBe(423);
    expect(correct.json<{ status: string }>().status).toBe('locked');
  });
});
