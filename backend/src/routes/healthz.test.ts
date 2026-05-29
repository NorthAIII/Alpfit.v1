import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestServer, type TestServer } from '../../test/build-test-server.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { createTestRedis, type TestRedis } from '../../test/redis.js';
import { loadEnv } from '../config/env.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createRedisClient, type Redis } from '../redis/client.js';
import { buildServer } from '../server.js';

import type { FastifyInstance } from 'fastify';

interface HealthzPayload {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  redis: 'up' | 'down';
  timestamp: string;
  version: string;
}

describe('GET /healthz — DB reachable', () => {
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

  it('returns 200 with status:ok, db:up and redis:up', async () => {
    const res = await server.app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as HealthzPayload;
    expect(body.status).toBe('ok');
    expect(body.db).toBe('up');
    expect(body.redis).toBe('up');
    expect(typeof body.timestamp).toBe('string');
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    expect(typeof body.version).toBe('string');
  });

  it('does not expose the production DATABASE_URL — env stub is in effect', () => {
    expect(process.env['DATABASE_URL']).toMatch(/postgres:\/\/dev:dev@postgres:5432\/dev/);
    expect(testDb.databaseUrl).toMatch(/\/alpfit_test_[0-9a-f]{12}$/);
    expect(testDb.databaseUrl).not.toBe(process.env['DATABASE_URL']);
  });
});

describe('GET /healthz — DB unreachable', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testRedis: TestRedis;

  beforeAll(async () => {
    // Bilerek ulaşılamaz host: DNS çözümlenmediği için $queryRaw fail → ping false.
    // connect_timeout=2 ile teste 5sn'den az tutulur (Postgres standardı parametre).
    const badUrl =
      'postgres://dev:dev@alpfit-no-such-host:5432/alpfit_test_broken?connect_timeout=2';
    const env = loadEnv({ ...process.env, DATABASE_URL: badUrl });
    prisma = createPrismaClient(badUrl);
    testRedis = createTestRedis(); // Redis erişilebilir; sadece DB down olmalı.
    app = await buildServer({ env, logger: false, prisma, redis: testRedis.redis });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect().catch(() => {
      // Bağlantı zaten ulaşılamaz olabilir; teardown gürültüsü test sonucunu etkilemesin.
    });
    await testRedis.cleanup();
  });

  it('returns 503 with status:degraded, db:down and redis:up', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(503);

    const body = res.json() as HealthzPayload;
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('down');
    expect(body.redis).toBe('up');
  });
});

describe('GET /healthz — Redis unreachable', () => {
  let app: FastifyInstance;
  let testDb: TestDatabase;
  let prisma: PrismaClient;
  let badRedis: Redis;

  beforeAll(async () => {
    testDb = await createTestDatabase(); // DB erişilebilir; sadece Redis down olmalı.
    const env = loadEnv({ ...process.env, DATABASE_URL: testDb.databaseUrl });
    prisma = createPrismaClient(testDb.databaseUrl);
    // Ulaşılamaz host + fail-fast: lazyConnect ile ping() anında bağlanmayı dener,
    // retryStrategy null + enableOfflineQueue false ile hızlıca reddedilir.
    badRedis = createRedisClient('redis://alpfit-no-such-host:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      connectTimeout: 2000,
    });
    app = await buildServer({ env, logger: false, prisma, redis: badRedis });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    badRedis.disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  it('returns 503 with status:degraded, db:up and redis:down', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(503);

    const body = res.json() as HealthzPayload;
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('up');
    expect(body.redis).toBe('down');
  });
});
