import { pingDatabase } from '../db/ping.js';

import type { FastifyPluginAsync } from 'fastify';

const VERSION = process.env['npm_package_version'] ?? '0.0.0';

export const healthzRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async (_req, reply) => {
    const dbUp = await pingDatabase(app.prisma);
    const payload = {
      status: dbUp ? ('ok' as const) : ('degraded' as const),
      db: dbUp ? ('up' as const) : ('down' as const),
      timestamp: new Date().toISOString(),
      version: VERSION,
    };
    return reply.code(dbUp ? 200 : 503).send(payload);
  });
};
