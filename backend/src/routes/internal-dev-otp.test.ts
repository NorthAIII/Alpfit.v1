/**
 * TASK-1.17 — GET /internal/dev-otp/:phoneE164 integration testleri.
 *
 * Doğrulanan senaryolar:
 *   - dev (NODE_ENV != production) + token → 200 son OTP (otpCode plaintext)
 *   - kayıt yoksa → 404 no_otp
 *   - production simülasyonu → 404 not_found (token doğru olsa bile)
 *   - token eksik / yanlış / Bearer prefix yok → 401
 *   - token env'de yok → 503 unconfigured
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { loadEnv } from '../config/env.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { buildServer } from '../server.js';

import type { FastifyInstance } from 'fastify';

const ADMIN_TOKEN = 'integration-test-admin-token-0123456789ab';
const PHONE = '+905551230099';
const CODE = '654321';

function devOtpUrl(phone: string): string {
  return `/internal/dev-otp/${encodeURIComponent(phone)}`;
}

describe('TASK-1.17 — dev OTP lookup (dev mode, token configured)', () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    const env = loadEnv({
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: testDb.databaseUrl,
      ADMIN_INTERNAL_TOKEN: ADMIN_TOKEN,
    });
    prisma = createPrismaClient(testDb.databaseUrl);
    app = await buildServer({ env, logger: false, prisma });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    await prisma.devOtpLog.deleteMany();
  });

  it('200 — returns the latest OTP for the phone', async () => {
    await prisma.devOtpLog.create({ data: { phoneE164: PHONE, code: 'old111', ttlSec: 300 } });
    await prisma.devOtpLog.create({ data: { phoneE164: PHONE, code: CODE, ttlSec: 300 } });

    const res = await app.inject({
      method: 'GET',
      url: devOtpUrl(PHONE),
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; otpCode: string; phoneE164: string };
    expect(body.status).toBe('ok');
    expect(body.otpCode).toBe(CODE); // son kayıt (createdAt desc)
    expect(body.phoneE164).toBe(PHONE);
  });

  it('404 — no OTP recorded for the phone', async () => {
    const res = await app.inject({
      method: 'GET',
      url: devOtpUrl('+905550000000'),
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 'no_otp' });
  });

  it('401 — missing Authorization header', async () => {
    const res = await app.inject({ method: 'GET', url: devOtpUrl(PHONE) });
    expect(res.statusCode).toBe(401);
  });

  it('401 — wrong token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: devOtpUrl(PHONE),
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('401 — no Bearer prefix', async () => {
    const res = await app.inject({
      method: 'GET',
      url: devOtpUrl(PHONE),
      headers: { authorization: ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('TASK-1.17 — dev OTP lookup (production → 404)', () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    const env = loadEnv({
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: testDb.databaseUrl,
      ADMIN_INTERNAL_TOKEN: ADMIN_TOKEN,
    });
    prisma = createPrismaClient(testDb.databaseUrl);
    app = await buildServer({ env, logger: false, prisma });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  it('404 — endpoint disabled in production even with a valid token + existing row', async () => {
    await prisma.devOtpLog.create({ data: { phoneE164: PHONE, code: CODE, ttlSec: 300 } });

    const res = await app.inject({
      method: 'GET',
      url: devOtpUrl(PHONE),
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 'not_found' });
  });
});

describe('TASK-1.17 — dev OTP lookup (token unconfigured → 503)', () => {
  let testDb: TestDatabase;
  let server: TestServer;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    // buildTestServer NODE_ENV=development + ADMIN_INTERNAL_TOKEN olmadan kurar.
    server = await buildTestServer({ databaseUrl: testDb.databaseUrl });
  });

  afterAll(async () => {
    await server.app.close();
    await server.prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  it('503 — ADMIN_INTERNAL_TOKEN not set', async () => {
    const res = await server.app.inject({
      method: 'GET',
      url: devOtpUrl(PHONE),
      headers: { authorization: 'Bearer anything' },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'unconfigured' });
  });
});
