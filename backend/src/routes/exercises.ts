/**
 * Exercises route handler (TASK-2.02).
 *
 * GET    /exercises          — çekirdek + trainer'ın custom'larını listeler
 * POST   /exercises          — PT custom egzersiz ekler (sadece trainer)
 * PUT    /exercises/:id      — PT kendi custom'ını düzenler (trainer + ownership)
 * DELETE /exercises/:id      — PT kendi custom'ını soft-delete eder (trainer + ownership)
 *
 * Tüm endpoint'ler `app.authenticate` arkasındadır.
 */
import { createExerciseSchema, updateExerciseSchema } from '@alpfit/shared';

import { t } from '../i18n/index.js';
import { ensureTrainer } from '../invitations/guard.js';
import {
  createExercise,
  deleteExercise,
  listExercises,
  updateExercise,
} from '../services/exercise.service.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const exercisesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/exercises', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) return reply;

    const claims = req.user as AccessTokenClaims;
    const query = req.query as { search?: string; muscleGroup?: string };

    const exercises = await listExercises(app.prisma, claims.sub, query.search, query.muscleGroup);
    return reply.code(200).send(exercises);
  });

  app.post('/exercises', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) return reply;

    const claims = req.user as AccessTokenClaims;
    const parsed = createExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const exercise = await createExercise(app.prisma, claims.sub, parsed.data);
    return reply.code(201).send(exercise);
  });

  app.put('/exercises/:id', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) return reply;

    const claims = req.user as AccessTokenClaims;
    const { id } = req.params as { id: string };
    const parsed = updateExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const result = await updateExercise(app.prisma, claims.sub, id, parsed.data);

    if (result.kind === 'not_found') {
      return reply.code(404).send({ status: 'not_found', message: t('exercises.notFound') });
    }
    if (result.kind === 'core_forbidden') {
      return reply.code(403).send({ status: 'forbidden', message: t('exercises.coreForbidden') });
    }
    if (result.kind === 'forbidden') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    return reply.code(200).send(result.exercise);
  });

  app.delete('/exercises/:id', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) return reply;

    const claims = req.user as AccessTokenClaims;
    const { id } = req.params as { id: string };

    const result = await deleteExercise(app.prisma, claims.sub, id);

    if (result.kind === 'not_found') {
      return reply.code(404).send({ status: 'not_found', message: t('exercises.notFound') });
    }
    if (result.kind === 'core_forbidden') {
      return reply.code(403).send({ status: 'forbidden', message: t('exercises.coreForbidden') });
    }
    if (result.kind === 'forbidden') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    return reply.code(204).send();
  });
};
