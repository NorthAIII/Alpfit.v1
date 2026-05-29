import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyInstance } from 'fastify';

import { healthzRoutes } from './routes/healthz.js';

import type { Env } from './config/env.js';
import type { LoggerOptions as PinoLoggerOptions } from 'pino';

export type LoggerConfig = PinoLoggerOptions | boolean;

export interface BuildServerOptions {
  env: Env;
  logger?: LoggerConfig;
}

export async function buildServer(opts: BuildServerOptions): Promise<FastifyInstance> {
  const logger: LoggerConfig = opts.logger ?? buildLoggerConfig(opts.env);
  const app = Fastify({ logger });

  await app.register(sensible);
  await app.register(cors, { origin: false });
  await app.register(healthzRoutes);

  return app;
}

function buildLoggerConfig(env: Env): PinoLoggerOptions {
  const base: PinoLoggerOptions = { level: env.LOG_LEVEL };
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
