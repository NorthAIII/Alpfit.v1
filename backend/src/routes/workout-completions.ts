/**
 * WorkoutCompletions route handler (TASK-2.04).
 *
 * POST /workout-completions        — "Antrenmanı bitir" (idempotent, sadece member)
 * GET  /me/workout-completions     — kendi geçmişi cursor-based pagination (sadece member)
 *
 * Tüm endpoint'ler `app.authenticate` arkasındadır.
 */
import { createWorkoutCompletionSchema } from '@alpfit/shared';
import { z } from 'zod';

import { t } from '../i18n/index.js';
import { processWorkoutCompletion } from '../services/streak.service.js';
import { completeWorkout, getMyWorkoutHistory } from '../services/workout-completion.service.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

const workoutHistoryQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

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

    const result = await completeWorkout(app.prisma, claims.sub, {
      programDayId,
      scheduledDate: new Date(scheduledDate),
      ...(typeof isLate === 'boolean' && { isLate }),
    });

    if (result.kind === 'forbidden') {
      return reply.code(403).send({ status: 'forbidden', message: t('workoutCompletions.forbidden') });
    }

    // Motor entegrasyonu — hata tamamlama kaydını engellemez (TASK-3.03)
    try {
      await processWorkoutCompletion(app.prisma, claims.sub);
    } catch (err) {
      req.log.error({ err }, 'streak motor hatası');
    }

    return reply.code(200).send(result.completion);
  });

  // ── GET /me/workout-completions ────────────────────────────────────────────
  app.get('/me/workout-completions', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const parsedQuery = workoutHistoryQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsedQuery.error.message });
    }
    const { cursor, limit } = parsedQuery.data;

    const page = await getMyWorkoutHistory(app.prisma, claims.sub, cursor, limit);

    return reply.code(200).send(page);
  });
};
