import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestRedis, type TestRedis } from '../../test/redis.js';
import { loadEnv } from '../config/env.js';
import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { buildServer } from '../server.js';

import type { FastifyInstance } from 'fastify';

// Web fallback DB/Redis'e dokunmaz (kod geçerliliği app içinde doğrulanır) —
// izole DB gerekmez. APP_BASE_URL test/setup.ts'te https://alpfit.app.
describe('GET /davet/:code — masaüstü fallback (TASK-1.25)', () => {
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
      // route bağlanmadı; teardown gürültüsü test sonucunu etkilemesin.
    });
    await testRedis.cleanup();
  });

  it('200 + text/html + davet linki + QR data-URI + kod içerir', async () => {
    const res = await app.inject({ method: 'GET', url: '/davet/ABC123' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);

    const html = res.body;
    // Davet linki APP_BASE_URL'den türetilir.
    expect(html).toContain('https://alpfit.app/davet/ABC123');
    // QR sunucu tarafında inline PNG data-URI olarak gömülür (harici servis yok).
    expect(html).toContain('data:image/png;base64,');
    // Davet kodu kullanıcıya gösterilir.
    expect(html).toContain('ABC123');
    // TR yönlendirme metni ("...mobil cihazda aç").
    expect(html).toContain('mobil cihazda aç');
  });

  it('HTML harici QR servisine istek yapmaz (img src data-URI)', async () => {
    const res = await app.inject({ method: 'GET', url: '/davet/XYZ789' });
    const html = res.body;
    // <img> kaynağı data-URI olmalı; harici http(s) QR endpoint'i geçmez.
    expect(html).toMatch(/<img[^>]+src="data:image\/png;base64,/);
    expect(html).not.toMatch(/qrserver|googleapis|api\.qr/i);
  });
});
