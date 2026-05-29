import { loadEnv } from '../src/config/env.js';
import { createPrismaClient, type PrismaClient } from '../src/db/prisma.js';
import { buildServer } from '../src/server.js';

import { createTestRedis } from './redis.js';

import type { Redis } from '../src/redis/client.js';
import type { FastifyInstance } from 'fastify';

export interface BuildTestServerOptions {
  databaseUrl: string;
}

export interface TestServer {
  app: FastifyInstance;
  prisma: PrismaClient;
  redis: Redis;
  /** Server'a enjekte edilen izole Redis client'ını kapatır (afterAll'da çağrılır). */
  closeRedis: () => Promise<void>;
}

export async function buildTestServer(opts: BuildTestServerOptions): Promise<TestServer> {
  const env = loadEnv({ ...process.env, DATABASE_URL: opts.databaseUrl });
  const prisma = createPrismaClient(opts.databaseUrl);
  const { redis, cleanup } = createTestRedis();
  const app = await buildServer({ env, logger: false, prisma, redis });
  return { app, prisma, redis, closeRedis: cleanup };
}
