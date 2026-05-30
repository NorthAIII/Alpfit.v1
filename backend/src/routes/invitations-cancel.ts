/**
 * DELETE /invitations/:id (TASK-1.23) — PT kendi davetini iptal eder.
 *
 * Yetki: `Authorization: Bearer <accessToken>` + trainer rolü. PT yalnızca
 * **kendi** bekleyen davetini iptal edebilir.
 *
 *   - 401 unauthorized : access token yok / geçersiz
 *   - 403 forbidden    : trainer değil VEYA davet başka PT'ye ait
 *   - 404 notFound     : davet yok
 *   - 409 notCancellable : davet pending değil (accepted/expired/cancelled)
 *   - 204              : davet iptal edildi (status `cancelled`, `cancelledAt` set)
 *
 * Bulunmayan davet 404, başka PT'nin daveti 403 (sahiplik ihlali — davetin
 * varlığını sızdırmadan ayırmak yerine net hata; davet ID'si tahmin edilemez
 * cuid). İptal yalnızca pending → cancelled; diğer status'lerde 409. Atomik
 * compare-and-set (`updateMany WHERE status = 'pending'`) eşzamanlı accept/cancel
 * race'inde çift iptali önler.
 */
import { t } from '../i18n/index.js';
import { ensureTrainer } from '../invitations/guard.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const invitationsCancelRoutes: FastifyPluginAsync = async (app) => {
  app.delete<{ Params: { id: string } }>(
    '/invitations/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) {
        return reply;
      }
      const claims = req.user as AccessTokenClaims;

      const invitation = await app.prisma.invitation.findUnique({
        where: { id: req.params.id },
        select: { id: true, trainerId: true, status: true },
      });

      if (invitation === null) {
        return reply
          .code(404)
          .send({ status: 'not_found' as const, message: t('invite.notFound') });
      }
      // Sahiplik ihlali — başka PT'nin daveti.
      if (invitation.trainerId !== claims.sub) {
        return reply
          .code(403)
          .send({ status: 'forbidden' as const, message: t('invite.forbidden') });
      }
      // Yalnızca pending davet iptal edilebilir (accepted/expired/cancelled → 409).
      if (invitation.status !== 'pending') {
        return reply
          .code(409)
          .send({ status: 'not_cancellable' as const, message: t('invite.notCancellable') });
      }

      // Atomik compare-and-set: eşzamanlı accept/cancel race'inde yalnızca biri kazanır.
      const cancelled = await app.prisma.invitation.updateMany({
        where: { id: invitation.id, status: 'pending' },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      // Race kaybı (count=0): bu arada accepted/cancelled olmuş → 409.
      if (cancelled.count === 0) {
        return reply
          .code(409)
          .send({ status: 'not_cancellable' as const, message: t('invite.notCancellable') });
      }

      return reply.code(204).send();
    },
  );
};
