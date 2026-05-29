/**
 * TASK-1.18 — POST /auth/otp/send integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - Geçerli TR telefon → 200; Redis `otp:send:` kaydı + dev_otp_log row tutarlı
 *   - Geçersiz / TR-dışı telefon → 400 invalid_phone
 *   - Aynı telefon ardışık 2 send → 2.si 429 + Retry-After
 *   - Rate penceresi dolduğunda (kilit anahtarı silinerek simüle) yeniden 200
 *   - Concurrent 100 send tek telefon → yalnızca 1 başarılı (atomik SET NX)
 *   - otp_sent audit event yazılır
 *
 * Test izolasyonu: per-suite Postgres (db.ts) + per-suite keyPrefix'li gerçek
 * Redis (redis.ts). Gerçek Redis TTL'i fake-timer ile ilerletilemez; "1 dakika
 * sonra" senaryosu rate kilidini silerek deterministik simüle edilir.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { otpRateKey, otpSendKey, type OtpRecord } from '../auth/otp.js';

const VALID = '+905551110011';
const VALID_2 = '+905551110022';
const VALID_RATE = '+905551110033';
const VALID_CONCURRENT = '+905551110044';
const FOREIGN = '+12025550123';

interface SendOk {
  success: true;
  expiresInSec: number;
}

function sendOtp(server: TestServer, phone: string) {
  return server.app.inject({ method: 'POST', url: '/auth/otp/send', payload: { phone } });
}

describe('TASK-1.18 — POST /auth/otp/send', () => {
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
  });

  it('200 — valid TR phone: Redis OTP + dev_otp_log + audit are consistent', async () => {
    const res = await sendOtp(server, VALID);
    expect(res.statusCode).toBe(200);

    const body = res.json() as SendOk;
    expect(body.success).toBe(true);
    expect(body.expiresInSec).toBe(300);

    // Redis'te aktif OTP kaydı var (keyPrefix otomatik eklenir — aynı client).
    const raw = await server.redis.get(otpSendKey(VALID));
    expect(raw).not.toBeNull();
    const record = JSON.parse(raw as string) as OtpRecord;
    expect(record.code).toMatch(/^\d{6}$/);
    expect(record.attempts).toBe(0);

    // dev_otp_log row'u Redis kodu ile birebir aynı.
    const row = await server.prisma.devOtpLog.findFirst({
      where: { phoneE164: VALID },
      orderBy: { createdAt: 'desc' },
    });
    expect(row).not.toBeNull();
    expect(row?.code).toBe(record.code);
    expect(row?.ttlSec).toBe(300);

    // otp_sent audit event yazıldı (append-only).
    const audit = await server.prisma.auditLog.findMany({ where: { eventType: 'otp_sent' } });
    expect(audit).toHaveLength(1);
  });

  it('400 — foreign (non-TR) phone is rejected without leaking existence', async () => {
    const res = await sendOtp(server, FOREIGN);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 'invalid_phone' });

    // Geçersiz numara için ne Redis kaydı ne dev_otp_log oluşmaz.
    expect(await server.redis.get(otpSendKey(FOREIGN))).toBeNull();
  });

  it('400 — empty / missing phone body', async () => {
    const res = await server.app.inject({ method: 'POST', url: '/auth/otp/send', payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 'invalid_phone' });
  });

  it('429 — second send within the rate window is blocked with Retry-After', async () => {
    const first = await sendOtp(server, VALID_2);
    expect(first.statusCode).toBe(200);

    const second = await sendOtp(server, VALID_2);
    expect(second.statusCode).toBe(429);
    expect(second.json()).toMatchObject({ status: 'rate_limited' });
    expect(second.headers['retry-after']).toBe('60');
  });

  it('200 — resend succeeds once the rate window elapses (lock key cleared)', async () => {
    const first = await sendOtp(server, VALID_RATE);
    expect(first.statusCode).toBe(200);

    // Gerçek Redis TTL'i fake-timer ile ilerletilemez → 60sn'lik pencerenin
    // dolmasını rate kilidini silerek simüle ediyoruz.
    await server.redis.del(otpRateKey(VALID_RATE));

    const second = await sendOtp(server, VALID_RATE);
    expect(second.statusCode).toBe(200);
  });

  it('concurrent 100 sends for one phone → exactly 1 succeeds (atomic SET NX)', async () => {
    const results = await Promise.all(
      Array.from({ length: 100 }, () => sendOtp(server, VALID_CONCURRENT)),
    );
    const ok = results.filter((r) => r.statusCode === 200).length;
    const limited = results.filter((r) => r.statusCode === 429).length;
    expect(ok).toBe(1);
    expect(limited).toBe(99);
  });
});
