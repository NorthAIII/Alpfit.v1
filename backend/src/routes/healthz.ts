import type { FastifyPluginAsync } from 'fastify';

const VERSION = process.env['npm_package_version'] ?? '0.0.0';

export const healthzRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async () => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    version: VERSION,
  }));
};
