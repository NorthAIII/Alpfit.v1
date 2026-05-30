import { getPinoRedactPaths } from '@alpfit/shared';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyInstance } from 'fastify';

import { ACCESS_TOKEN_TTL_SEC } from './auth/jwt.js';
import { registerAuthGuard } from './auth/middleware.js';
import { getPrisma } from './db/prisma.js';
import { getRedis, type Redis } from './redis/client.js';
import { adminInternalRoutes } from './routes/admin-internal.js';
import { authLogoutAllRoutes } from './routes/auth-logout-all.js';
import { authLogoutRoutes } from './routes/auth-logout.js';
import { authMeRoutes } from './routes/auth-me.js';
import { authOtpSendRoutes } from './routes/auth-otp-send.js';
import { authOtpVerifyRoutes } from './routes/auth-otp-verify.js';
import { authProfileRoutes } from './routes/auth-profile.js';
import { authRefreshRoutes } from './routes/auth-refresh.js';
import { davetWebFallbackRoutes } from './routes/davet-web-fallback.js';
import { healthzRoutes } from './routes/healthz.js';
import { internalDevOtpRoutes } from './routes/internal-dev-otp.js';
import { invitationsAcceptRoutes } from './routes/invitations-accept.js';
import { invitationsCancelRoutes } from './routes/invitations-cancel.js';
import { invitationsCreateRoutes } from './routes/invitations-create.js';
import { invitationsListRoutes } from './routes/invitations-list.js';
import { invitationsPreviewRoutes } from './routes/invitations-preview.js';
import { exercisesRoutes } from './routes/exercises.js';
import { trainersEventsRoutes } from './routes/trainers-events.js';
import { trainersMembersRoutes } from './routes/trainers-members.js';
import { wellKnownRoutes } from './routes/well-known.js';

import type { Env } from './config/env.js';
import type { PrismaClient } from './db/prisma.js';
import type { LoggerOptions as PinoLoggerOptions } from 'pino';

export type LoggerConfig = PinoLoggerOptions | boolean;

export interface BuildServerOptions {
  env: Env;
  logger?: LoggerConfig;
  prisma?: PrismaClient;
  redis?: Redis;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
  }
}

export async function buildServer(opts: BuildServerOptions): Promise<FastifyInstance> {
  const logger: LoggerConfig = opts.logger ?? buildLoggerConfig(opts.env);
  const app = Fastify({ logger });

  const prisma = opts.prisma ?? getPrisma(opts.env.DATABASE_URL);
  app.decorate('prisma', prisma);

  // db/prisma.ts deseni: test'ler izole client enjekte eder, production singleton
  // kullanır. error event'i dinlenmezse Node EventEmitter 'error'da throw eder —
  // pino'ya logla (redact PII'yi maskeler).
  const redis = opts.redis ?? getRedis(opts.env.REDIS_URL);
  app.decorate('redis', redis);
  redis.on('error', (err) => app.log.error({ err }, 'redis client error'));

  // JWT (TASK-1.20): access + kayıt jetonu tek secret (HS256) ile imzalanır.
  // `expiresIn` saniye cinsinden (access default; registration per-call override).
  await app.register(jwt, {
    secret: opts.env.JWT_ACCESS_SECRET,
    sign: { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL_SEC },
  });
  // `app.authenticate` decorator'ı — korumalı route'lardan ÖNCE register edilir.
  registerAuthGuard(app);

  await app.register(sensible);
  await app.register(cors, { origin: false });
  await app.register(healthzRoutes);
  await app.register(adminInternalRoutes({ env: opts.env }));
  await app.register(internalDevOtpRoutes({ env: opts.env }));
  await app.register(authOtpSendRoutes({ env: opts.env }));
  await app.register(authOtpVerifyRoutes);
  await app.register(authProfileRoutes);
  await app.register(authRefreshRoutes);
  await app.register(authLogoutRoutes);
  await app.register(authLogoutAllRoutes);
  await app.register(authMeRoutes);
  await app.register(invitationsCreateRoutes({ env: opts.env }));
  await app.register(invitationsListRoutes({ env: opts.env }));
  await app.register(invitationsCancelRoutes);
  await app.register(invitationsAcceptRoutes);
  await app.register(invitationsPreviewRoutes);
  await app.register(trainersMembersRoutes);
  await app.register(trainersEventsRoutes);
  await app.register(exercisesRoutes);
  // Deep link altyapısı (TASK-1.25): iOS/Android `.well-known/` + masaüstü
  // davet fallback sayfası (QR). bunker-nginx tüm path'leri backend'e proxy'ler.
  await app.register(wellKnownRoutes({ env: opts.env }));
  await app.register(davetWebFallbackRoutes({ env: opts.env }));

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
