/**
 * GET /invitations/:code (TASK-1.24) — davet ön bilgisi (public, auth gerekmez).
 *
 * Davet linkine tıklayan kullanıcı, app'e giriş yapmadan **PT'nin ismini**
 * görsün diye public'tir (UX: üye doğru PT'ye bağlandığını doğrular). PII riski
 * düşük — yalnızca PT ad + soyad döner; telefon/profil/üye verisi YOK. Davet
 * kodu zaten paylaşılırken bu görünürlük bilinçli kabul edilir (F1.1, karar:
 * tam isim → üye PT'sini doğrulasın).
 *
 *   - 404 not_found        : davet yok VEYA PT hesabı soft-deleted
 *   - 410 { status: 'expired' }   : süresi dolmuş (lazy-check)
 *   - 410 { status: 'cancelled' } : PT iptal etmiş
 *   - 410 { status: 'accepted' }  : zaten kullanılmış
 *   - 200 { trainerFirstName, trainerLastName, expiresAt } : geçerli (pending)
 */
import { t } from '../i18n/index.js';
import { markIfExpired } from '../invitations/expiry.js';

import type { FastifyPluginAsync } from 'fastify';

export const invitationsPreviewRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { code: string } }>('/invitations/:code', async (req, reply) => {
    const invitation = await app.prisma.invitation.findUnique({
      where: { code: req.params.code },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        trainer: { select: { firstName: true, lastName: true, deletedAt: true } },
      },
    });

    // Davet yok veya PT hesabı soft-deleted → geçersiz (varlık sızdırılmaz).
    if (invitation === null || invitation.trainer.deletedAt !== null) {
      return reply.code(404).send({ status: 'not_found' as const, message: t('invite.notFound') });
    }

    // Lazy expiry: pending + süresi dolmuşsa expired'a çek.
    const expired = await markIfExpired(app.prisma, invitation);
    if (expired || invitation.status === 'expired') {
      return reply.code(410).send({ status: 'expired' as const });
    }
    if (invitation.status === 'cancelled') {
      return reply.code(410).send({ status: 'cancelled' as const });
    }
    if (invitation.status === 'accepted') {
      return reply.code(410).send({ status: 'accepted' as const });
    }

    return reply.code(200).send({
      trainerFirstName: invitation.trainer.firstName,
      trainerLastName: invitation.trainer.lastName,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  });
};
