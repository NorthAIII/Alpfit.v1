import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestRedis, type TestRedis } from '../../test/redis.js';
import { loadEnv } from '../config/env.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { buildServer } from '../server.js';

import type { FastifyInstance } from 'fastify';

// Bu route'lar DB/Redis'e dokunmaz — izole test DB'ye gerek yok. Stub
// DATABASE_URL ile server kurulur (buildServer boot'ta bağlanmaz; bu route'lar
// hiç sorgu yapmaz). Env stub'ları test/setup.ts'te (APPLE_APP_ID +
// ANDROID_SHA256_CERT_FINGERPRINTS deterministik test değerleriyle).
describe('GET /.well-known/* — deep link association (TASK-1.25)', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testRedis: TestRedis;

  beforeAll(async () => {
    const env = loadEnv(process.env);
    prisma = createPrismaClient(env.DATABASE_URL);
    testRedis = createTestRedis();
    app = await buildServer({ env, logger: false, prisma, redis: testRedis.redis });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect().catch(() => {
      // route'lar bağlanmadı; teardown gürültüsü test sonucunu etkilemesin.
    });
    await testRedis.cleanup();
  });

  it('apple-app-site-association → 200 + application/json + doğru appID/paths', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/.well-known/apple-app-site-association',
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const body = res.json() as {
      applinks: { apps: string[]; details: { appID: string; paths: string[] }[] };
    };
    expect(body.applinks.apps).toEqual([]);
    expect(body.applinks.details).toHaveLength(1);
    expect(body.applinks.details[0]?.appID).toBe('TESTTEAMID.app.alpfit.mobile');
    expect(body.applinks.details[0]?.paths).toEqual(['/davet/*']);
  });

  it('assetlinks.json → 200 + application/json + paket adı + fingerprint listesi', async () => {
    const res = await app.inject({ method: 'GET', url: '/.well-known/assetlinks.json' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const body = res.json() as {
      relation: string[];
      target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
    }[];
    expect(body).toHaveLength(1);
    expect(body[0]?.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(body[0]?.target.namespace).toBe('android_app');
    expect(body[0]?.target.package_name).toBe('app.alpfit.mobile');
    // Stub tek fingerprint içerir; virgül-parse boş eleman üretmemeli.
    expect(body[0]?.target.sha256_cert_fingerprints).toEqual([
      'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
    ]);
  });
});
