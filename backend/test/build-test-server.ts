import { loadEnv } from '../src/config/env.js';
import { createPrismaClient, type PrismaClient } from '../src/db/prisma.js';
import { buildServer } from '../src/server.js';

import type { FastifyInstance } from 'fastify';

export interface BuildTestServerOptions {
  databaseUrl: string;
}

export interface TestServer {
  app: FastifyInstance;
  prisma: PrismaClient;
}

export async function buildTestServer(opts: BuildTestServerOptions): Promise<TestServer> {
  const env = loadEnv({ ...process.env, DATABASE_URL: opts.databaseUrl });
  const prisma = createPrismaClient(opts.databaseUrl);
  const app = await buildServer({ env, logger: false, prisma });
  return { app, prisma };
}
