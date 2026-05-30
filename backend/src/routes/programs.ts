/**
 * Programs route handler (TASK-2.03).
 *
 * POST   /programs                    — yeni draft program oluştur (trainer)
 * PATCH  /programs/:id                — auto-save (tüm yapı upsert, sadece draft, trainer)
 * POST   /programs/:id/publish        — üyeye yayınla (trainer)
 * POST   /programs/:id/copy           — başka üyeye kopyala (trainer)
 * GET    /programs/:id                — tam program (trainer kendi | member kendi)
 * GET    /members/:memberId/program   — üyenin aktif programı (trainer view)
 * GET    /me/program                  — kendi aktif programı + hasUnreadUpdate (member)
 *
 * Tüm endpoint'ler `app.authenticate` arkasındadır.
 */
import { createProgramSchema, patchProgramSchema } from '@alpfit/shared';

import { t } from '../i18n/index.js';
import { ensureTrainer } from '../invitations/guard.js';
import {
  copyProgram,
  getMemberActiveProgram,
  getMyActiveProgram,
  getProgram,
  patchProgram,
  publishProgram,
  createProgram,
} from '../services/program.service.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const programsRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /programs ─────────────────────────────────────────────────────────
  app.post('/programs', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) return reply;

    const claims = req.user as AccessTokenClaims;
    const parsed = createProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const result = await createProgram(app.prisma, claims.sub, parsed.data.memberId);

    if (result.kind === 'no_relation') {
      return reply
        .code(403)
        .send({ status: 'forbidden', message: t('programs.memberNoRelation') });
    }

    return reply.code(201).send(result.program);
  });

  // ── PATCH /programs/:id ────────────────────────────────────────────────────
  app.patch<{ Params: { id: string } }>(
    '/programs/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) return reply;

      const claims = req.user as AccessTokenClaims;
      const { id } = req.params;
      const parsed = patchProgramSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
      }

      const result = await patchProgram(app.prisma, claims.sub, id, parsed.data);

      if (result.kind === 'not_found') {
        return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
      }
      if (result.kind === 'forbidden') {
        return reply.code(403).send({ status: 'forbidden', message: t('programs.forbidden') });
      }
      if (result.kind === 'not_draft') {
        return reply
          .code(422)
          .send({ status: 'not_draft', message: t('programs.notDraft') });
      }

      return reply.code(200).send(result.program);
    },
  );

  // ── POST /programs/:id/publish ─────────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/programs/:id/publish',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) return reply;

      const claims = req.user as AccessTokenClaims;
      const { id } = req.params;

      const result = await publishProgram(app.prisma, claims.sub, id);

      if (result.kind === 'not_found') {
        return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
      }
      if (result.kind === 'forbidden') {
        return reply.code(403).send({ status: 'forbidden', message: t('programs.forbidden') });
      }

      return reply.code(200).send({ program: result.program, bannerEvent: 'program_changed' });
    },
  );

  // ── POST /programs/:id/copy ────────────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/programs/:id/copy',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) return reply;

      const claims = req.user as AccessTokenClaims;
      const { id } = req.params;
      const body = req.body as { targetMemberId?: unknown };

      if (typeof body.targetMemberId !== 'string' || !body.targetMemberId) {
        return reply
          .code(400)
          .send({ status: 'bad_request', message: 'targetMemberId gerekli.' });
      }

      const result = await copyProgram(app.prisma, claims.sub, id, body.targetMemberId);

      if (result.kind === 'not_found') {
        return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
      }
      if (result.kind === 'forbidden') {
        return reply.code(403).send({ status: 'forbidden', message: t('programs.forbidden') });
      }
      if (result.kind === 'no_relation') {
        return reply
          .code(403)
          .send({ status: 'forbidden', message: t('programs.memberNoRelation') });
      }

      return reply.code(201).send(result.program);
    },
  );

  // ── GET /programs/:id ──────────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/programs/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      const claims = req.user as AccessTokenClaims;
      const { id } = req.params;

      if (claims.role !== 'trainer' && claims.role !== 'member') {
        return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
      }

      const result = await getProgram(app.prisma, claims.sub, id, claims.role as 'trainer' | 'member');

      if (result.kind === 'not_found') {
        return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
      }
      if (result.kind === 'forbidden') {
        return reply.code(403).send({ status: 'forbidden', message: t('programs.forbidden') });
      }

      return reply.code(200).send(result.program);
    },
  );

  // ── GET /members/:memberId/program ─────────────────────────────────────────
  app.get<{ Params: { memberId: string } }>(
    '/members/:memberId/program',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) return reply;

      const claims = req.user as AccessTokenClaims;
      const { memberId } = req.params;

      const result = await getMemberActiveProgram(app.prisma, claims.sub, memberId);

      if (result.kind === 'no_relation') {
        return reply
          .code(403)
          .send({ status: 'forbidden', message: t('programs.memberNoRelation') });
      }
      if (result.kind === 'not_found') {
        return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
      }

      return reply.code(200).send(result.program);
    },
  );

  // ── GET /me/program ────────────────────────────────────────────────────────
  app.get('/me/program', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const result = await getMyActiveProgram(app.prisma, claims.sub);

    if (result.kind === 'not_found') {
      return reply.code(404).send({ status: 'not_found', message: t('programs.notFound') });
    }

    return reply.code(200).send(result.program);
  });
};
