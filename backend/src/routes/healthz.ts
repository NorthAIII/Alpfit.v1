import { pingDatabase } from '../db/ping.js';
import { pingRedis } from '../redis/client.js';

import type { FastifyPluginAsync } from 'fastify';

const VERSION = process.env['npm_package_version'] ?? '0.0.0';

export const healthzRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async (_req, reply) => {
    const [dbUp, redisUp] = await Promise.all([pingDatabase(app.prisma), pingRedis(app.redis)]);
    const up = dbUp && redisUp;
    const payload = {
      status: up ? ('ok' as const) : ('degraded' as const),
      db: dbUp ? ('up' as const) : ('down' as const),
      redis: redisUp ? ('up' as const) : ('down' as const),
      timestamp: new Date().toISOString(),
      version: VERSION,
    };
    return reply.code(up ? 200 : 503).send(payload);
  });
};
