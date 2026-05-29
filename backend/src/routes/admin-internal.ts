/**
 * Internal admin endpoints (TASK-1.15) — host crontab tarafından çağrılır,
 * son kullanıcıya gösterilmez.
 *
 *   POST /admin/internal/retention-purge
 *     - Bearer auth: `Authorization: Bearer <ADMIN_INTERNAL_TOKEN>`
 *     - Body: yok
 *     - 200: `RetentionPurgeReport` (purge edilen kullanıcı sayıları)
 *     - 401: token eksik / yanlış
 *     - 503: ADMIN_INTERNAL_TOKEN env yok (yanlış konfigürasyon)
 *
 * Cron kurulum rehberi: `_dev/docs/staging-retention-cron.md`.
 * Kararlar: `_dev/docs/DECISIONS.md` "2026-05-29 — TASK-1.15".
 */
import { runRetentionPurge } from '../kvkk/retention-job.js';

import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

export interface AdminInternalRoutesOptions {
  env: Pick<Env, 'ADMIN_INTERNAL_TOKEN'>;
}

const BEARER_PREFIX = 'Bearer ';

function extractBearer(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string') return null;
  if (!header.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
}

export const adminInternalRoutes =
  (opts: AdminInternalRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.post('/admin/internal/retention-purge', async (req, reply) => {
      const configured = opts.env.ADMIN_INTERNAL_TOKEN;
      if (!configured) {
        return reply.code(503).send({
          status: 'unconfigured' as const,
          message: 'ADMIN_INTERNAL_TOKEN not set; retention purge endpoint disabled.',
        });
      }

      const provided = extractBearer(req.headers.authorization);
      if (provided !== configured) {
        return reply.code(401).send({ status: 'unauthorized' as const });
      }

      const report = await runRetentionPurge(app.prisma);
      return reply.code(200).send({ status: 'ok' as const, report });
    });
  };
