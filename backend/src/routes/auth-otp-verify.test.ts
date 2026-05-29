/**
 * TASK-1.19 — POST /auth/otp/verify integration testleri.
 *
 * Doğrulanan senaryolar (F1.1 brute-force kuralı):
 *   - Doğru kod → 200; OTP key silindi, `otp_verified` audit, dev_otp_log consumed
 *   - Doğru kod + kayıtlı kullanıcı → userExists:true / isNew:false
 *   - Yanlış kod 1 deneme → 401, attempts=1
 *   - 5 hatalı deneme → 5.si 423 lockout, `otp_verify_failed` 5 kayıt
 *   - Lockout aktifken doğru kod → 423 (kilit kod kontrolünden önce)
 *   - "15dk sonra" (lockout key silinerek simüle) → yeni send + verify çalışır
 *   - Süresi dolmuş / hiç olmayan OTP → 410
 *   - Eşzamanlı 2 verify aynı doğru koda → biri 200 biri 410 (atomik GETDEL)
 *   - Brute-force smoke: 1000 random kod sabit koda eşleşmez
 *
 * Test izolasyonu: per-suite Postgres (db.ts) + per-suite keyPrefix'li gerçek
 * Redis (redis.ts). Her senaryo ayrı telefon kullanır (key çakışması yok);
 * gerçek Redis TTL fake-timer ile ilerletilemediğinden "15dk sonra" lockout
 * key'i silinerek deterministik simüle edilir.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import {
  codesMatch,
  generateOtp,
  otpAttemptsKey,
  otpLockoutKey,
  otpSendKey,
  storeOtp,
  OTP_LOCKOUT_SEC,
} from '../auth/otp.js';

const KNOWN_CODE = '123456';

function verify(server: TestServer, phone: string, code: string) {
  return server.app.inject({
    method: 'POST',
    url: '/auth/otp/verify',
    payload: { phone, code },
  });
}

describe('TASK-1.19 — POST /auth/otp/verify', () => {
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
    await server.prisma.devOtpLog.deleteMany();
    await server.prisma.auditLog.deleteMany();
    await server.prisma.trainerMember.deleteMany();
    await server.prisma.user.deleteMany();
  });

  it('200 — correct code consumes OTP and writes otp_verified audit', async () => {
    const phone = '+905551110011';
    await storeOtp(server.redis, phone, KNOWN_CODE);

    const res = await verify(server, phone, KNOWN_CODE);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ verified: true, userExists: false, isNew: true });

    // OTP key atomik tüketildi (replay artık 410 döner).
    expect(await server.redis.get(otpSendKey(phone))).toBeNull();

    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'otp_verified' } });
    expect(audit).toHaveLength(1);
  });

  it('200 — existing active user → userExists:true / isNew:false', async () => {
    const phone = '+905551110099';
    await server.prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'Ada', lastName: 'Yıldız' },
    });
    await storeOtp(server.redis, phone, KNOWN_CODE);

    const res = await verify(server, phone, KNOWN_CODE);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ verified: true, userExists: true, isNew: false });
  });

  it('200 — marks the latest dev_otp_log row consumed (via real send flow)', async () => {
    const phone = '+905551110022';
    const sent = await server.app.inject({
      method: 'POST',
      url: '/auth/otp/send',
      payload: { phone },
    });
    expect(sent.statusCode).toBe(200);

    // Gönderilen kodu Redis'ten oku (send rastgele üretir).
    const raw = await server.redis.get(otpSendKey(phone));
    const code = (JSON.parse(raw as string) as { code: string }).code;

    const res = await verify(server, phone, code);
    expect(res.statusCode).toBe(200);

    const row = await server.prisma.devOtpLog.findFirst({
      where: { phoneE164: phone },
      orderBy: { createdAt: 'desc' },
    });
    expect(row?.consumedAt).not.toBeNull();
  });

  it('401 — single wrong code increments attempts to 1', async () => {
    const phone = '+905551110033';
    await storeOtp(server.redis, phone, KNOWN_CODE);

    const res = await verify(server, phone, '000000');
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ status: 'invalid_code' });

    expect(await server.redis.get(otpAttemptsKey(phone))).toBe('1');
    // OTP hâlâ duruyor — doğru kod sonradan geçebilir.
    expect(await server.redis.get(otpSendKey(phone))).not.toBeNull();
  });

  it('423 — 5th wrong attempt locks the phone (15 min) with 5 failed audits', async () => {
    const phone = '+905551110044';
    await storeOtp(server.redis, phone, KNOWN_CODE);

    const codes = ['000000', '111111', '222222', '333333', '444444'];
    const statuses: number[] = [];
    for (const c of codes) {
      const res = await verify(server, phone, c);
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 423]);

    // Lockout key TTL ~900sn.
    const ttl = await server.redis.ttl(otpLockoutKey(phone));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(OTP_LOCKOUT_SEC);

    // Lockout aktif OTP + sayaç key'lerini temizledi.
    expect(await server.redis.get(otpSendKey(phone))).toBeNull();
    expect(await server.redis.get(otpAttemptsKey(phone))).toBeNull();

    const failed = await server.prisma.auditLog.findMany({
      where: { eventType: 'otp_verify_failed' },
    });
    expect(failed).toHaveLength(5);
  });

  it('423 — locked phone rejects even the correct code (lock precedes code check)', async () => {
    const phone = '+905551110055';
    // OTP seed + manuel kilit: kilit kod kontrolünden önce devreye girmeli.
    await storeOtp(server.redis, phone, KNOWN_CODE);
    await server.redis.set(otpLockoutKey(phone), '1', 'EX', OTP_LOCKOUT_SEC);

    const res = await verify(server, phone, KNOWN_CODE);
    expect(res.statusCode).toBe(423);
    expect(res.json()).toMatchObject({ status: 'locked' });
    expect(res.headers['retry-after']).toBeDefined();

    const failed = await server.prisma.auditLog.findMany({
      where: { eventType: 'otp_verify_failed' },
    });
    expect(failed).toHaveLength(1);
    expect((failed[0]?.metadata as { reason?: string }).reason).toBe('locked');
  });

  it('200 — once the lockout elapses (key cleared) a fresh send + verify works', async () => {
    const phone = '+905551110066';
    await server.redis.set(otpLockoutKey(phone), '1', 'EX', OTP_LOCKOUT_SEC);

    const locked = await verify(server, phone, KNOWN_CODE);
    expect(locked.statusCode).toBe(423);

    // Gerçek Redis TTL ilerletilemez → 15dk geçişini kilit key'ini silerek simüle.
    await server.redis.del(otpLockoutKey(phone));

    await storeOtp(server.redis, phone, KNOWN_CODE);
    const res = await verify(server, phone, KNOWN_CODE);
    expect(res.statusCode).toBe(200);
  });

  it('410 — verifying with no active OTP (expired/never sent) is Gone', async () => {
    const phone = '+905551110077';
    const res = await verify(server, phone, KNOWN_CODE);
    expect(res.statusCode).toBe(410);
    expect(res.json()).toMatchObject({ status: 'expired' });
  });

  it('400 — foreign (non-TR) phone is rejected without leaking existence', async () => {
    const res = await verify(server, '+12025550123', KNOWN_CODE);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 'invalid_phone' });
  });

  it('410 — concurrent verify of the same correct code: one 200, one 410', async () => {
    const phone = '+905551110088';
    await storeOtp(server.redis, phone, KNOWN_CODE);

    const [a, b] = await Promise.all([
      verify(server, phone, KNOWN_CODE),
      verify(server, phone, KNOWN_CODE),
    ]);
    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 410]);
  });

  it('brute-force smoke — 1000 random codes never match a fixed code', () => {
    let falsePositives = 0;
    for (let i = 0; i < 1000; i++) {
      const guess = generateOtp();
      if (codesMatch(guess, KNOWN_CODE) !== (guess === KNOWN_CODE)) {
        falsePositives++;
      }
    }
    expect(falsePositives).toBe(0);
  });
});
