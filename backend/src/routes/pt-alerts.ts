/**
 * PT uyarı eylemleri (TASK-3.10).
 *
 * PATCH /pt/member-alerts/:memberId/dismiss-t7
 *   PT "Okudum" → T+7 banner'ını okundu işaretle.
 *
 * Yetki: trainer rolü + trainer-member aktif ilişki (ownership).
 * ptT7DismissedAt set edilince banner kaybolur, tekrar belirmez
 * (re-aktivasyon ptT7AlertedAt sıfırlar ama ptT7DismissedAt'ı sıfırlamaz — M3 kararı).
 */
import { z } from 'zod';

import { ensureTrainer } from '../invitations/guard.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

const memberIdParamsSchema = z.object({ memberId: z.string().cuid() });

export const ptAlertsRoutes: FastifyPluginAsync = async (app) => {
  app.patch(
    '/pt/member-alerts/:memberId/dismiss-t7',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) return reply;

      const claims = req.user as AccessTokenClaims;

      const parsed = memberIdParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
      }

      const { memberId } = parsed.data;
      const trainerId = claims.sub;

      // Ownership: trainer-member aktif ilişki + üye silinmemiş
      const rel = await app.prisma.trainerMember.findFirst({
        where: { trainerId, memberId, endedAt: null, member: { deletedAt: null } },
        select: { memberId: true },
      });

      if (!rel) {
        return reply.code(403).send({ status: 'forbidden', message: 'Bu üye için işlem yapma yetkiniz yok.' });
      }

      await app.prisma.streakState.updateMany({
        where: { memberId },
        data: { ptT7DismissedAt: new Date() },
      });

      return reply.code(200).send();
    },
  );
};
