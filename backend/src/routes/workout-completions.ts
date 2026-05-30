/**
 * WorkoutCompletions route handler (TASK-2.04).
 *
 * POST /workout-completions        — "Antrenmanı bitir" (idempotent, sadece member)
 * GET  /me/workout-completions     — kendi geçmişi cursor-based pagination (sadece member)
 *
 * Tüm endpoint'ler `app.authenticate` arkasındadır.
 */
import { createWorkoutCompletionSchema } from '@alpfit/shared';

import { t } from '../i18n/index.js';
import { completeWorkout, getMyWorkoutHistory } from '../services/workout-completion.service.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const workoutCompletionsRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /workout-completions ──────────────────────────────────────────────
  app.post('/workout-completions', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const parsed = createWorkoutCompletionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const { programDayId, scheduledDate, isLate } = parsed.data;

    const row = await completeWorkout(app.prisma, claims.sub, {
      programDayId,
      scheduledDate: new Date(scheduledDate),
      ...(typeof isLate === 'boolean' && { isLate }),
    });

    return reply.code(200).send(row);
  });

  // ── GET /me/workout-completions ────────────────────────────────────────────
  app.get('/me/workout-completions', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const query = req.query as { cursor?: string; limit?: string };
    const cursor = query.cursor;
    const limit = query.limit ? parseInt(query.limit, 10) : 30;

    const page = await getMyWorkoutHistory(app.prisma, claims.sub, cursor, limit);

    return reply.code(200).send(page);
  });
};
