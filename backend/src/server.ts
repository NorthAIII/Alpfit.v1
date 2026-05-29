import { getPinoRedactPaths } from '@alpfit/shared';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyInstance } from 'fastify';

import { getPrisma } from './db/prisma.js';
import { adminInternalRoutes } from './routes/admin-internal.js';
import { healthzRoutes } from './routes/healthz.js';

import type { Env } from './config/env.js';
import type { PrismaClient } from './db/prisma.js';
import type { LoggerOptions as PinoLoggerOptions } from 'pino';

export type LoggerConfig = PinoLoggerOptions | boolean;

export interface BuildServerOptions {
  env: Env;
  logger?: LoggerConfig;
  prisma?: PrismaClient;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export async function buildServer(opts: BuildServerOptions): Promise<FastifyInstance> {
  const logger: LoggerConfig = opts.logger ?? buildLoggerConfig(opts.env);
  const app = Fastify({ logger });

  const prisma = opts.prisma ?? getPrisma(opts.env.DATABASE_URL);
  app.decorate('prisma', prisma);

  await app.register(sensible);
  await app.register(cors, { origin: false });
  await app.register(healthzRoutes);
  await app.register(adminInternalRoutes({ env: opts.env }));

  return app;
}

function buildLoggerConfig(env: Env): PinoLoggerOptions {
  const base: PinoLoggerOptions = {
    level: env.LOG_LEVEL,
    redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' },
  };
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
    return base;
  }
  return {
    ...base,
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
    },
  };
}
