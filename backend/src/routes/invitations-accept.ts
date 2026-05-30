/**
 * POST /invitations/:code/accept (TASK-1.24) — üye davet kodunu kabul eder.
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`). Üye OTP
 * verify + profil oluşturup login olduktan sonra bu endpoint'i çağırır; davet
 * **tek kullanımlık**, kabul eden üye davet sahibi PT'ye **otomatik bağlanır**
 * (aktif `TrainerMember` ilişkisi kurulur, F1.1).
 *
 *   - 401 unauthorized       : access token yok / geçersiz (middleware)
 *   - 404 not_found          : davet yok VEYA PT hesabı soft-deleted
 *   - 410 expired            : davet süresi dolmuş (lazy-check)
 *   - 410 cancelled          : davet PT tarafından iptal edilmiş
 *   - 409 already_used        : davet zaten kullanılmış (accepted)
 *   - 400 own_invitation     : PT kendi davetini kabul edemez
 *   - 403 forbidden          : kullanıcı üye değil (trainer/gym_owner)
 *   - 409 already_has_trainer : üyenin zaten aktif bir PT'si var (v1; değiştirme v1.5)
 *   - 200 { trainerId, trainerFirstName, trainerLastName }
 *
 * Doğrulama sırası nüansı: **own_invitation (400) role kontrolünden (403)
 * ÖNCE** gelir. Aksi halde davetini kabul etmeye çalışan bir PT role guard'a
 * takılıp 403 alır; oysa "kendi davetini kabul" daha spesifik bir hatadır (400).
 * Üye için own-check hiçbir zaman tetiklenmez (davet sahibi her zaman trainer).
 *
 * Atomiklik: status compare-and-set (`updateMany WHERE status='pending'`) +
 * `TrainerMember.create` + audit tek `$transaction`'da. Eşzamanlı iki üye aynı
 * kodu kabul ederse yalnızca biri count=1 alır (diğeri count=0 → 409). Üyenin
 * aktif PT tekliği DB partial unique index ile garanti (race'te P2002 → 409).
 */
import { createPtMemberRelation } from '../auth/relations.js';
import { t } from '../i18n/index.js';
import { markIfExpired } from '../invitations/expiry.js';
import { logAuditEvent } from '../kvkk/audit.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';

/** Transaction içinde status compare-and-set kaybını işaretleyen sentinel. */
class InvitationRaceLostError extends Error {
  constructor() {
    super('invitation status changed concurrently');
    this.name = 'InvitationRaceLostError';
  }
}

/** Prisma unique-constraint ihlali (`P2002`) — aktif PT tekliği race'i. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

function alreadyHasTrainer(reply: FastifyReply): FastifyReply {
  return reply
    .code(409)
    .send({ status: 'already_has_trainer' as const, message: t('invite.alreadyHasTrainer') });
}

export const invitationsAcceptRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Params: { code: string } }>(
    '/invitations/:code/accept',
    { preHandler: app.authenticate },
    async (req, reply) => {
      const claims = req.user as AccessTokenClaims;
      const memberId = claims.sub;

      const invitation = await app.prisma.invitation.findUnique({
        where: { code: req.params.code },
        select: {
          id: true,
          trainerId: true,
          status: true,
          expiresAt: true,
          trainer: { select: { firstName: true, lastName: true, deletedAt: true } },
        },
      });

      // Davet yok veya PT hesabı soft-deleted → geçersiz (varlık sızdırılmaz).
      if (invitation === null || invitation.trainer.deletedAt !== null) {
        return reply
          .code(404)
          .send({ status: 'not_found' as const, message: t('invite.notFound') });
      }

      // Lazy expiry: pending + süresi dolmuşsa expired'a çek → 410.
      const expired = await markIfExpired(app.prisma, invitation);
      if (expired || invitation.status === 'expired') {
        return reply.code(410).send({ status: 'expired' as const, message: t('invite.expired') });
      }
      if (invitation.status === 'accepted') {
        return reply
          .code(409)
          .send({ status: 'already_used' as const, message: t('invite.alreadyUsed') });
      }
      if (invitation.status === 'cancelled') {
        return reply
          .code(410)
          .send({ status: 'cancelled' as const, message: t('invite.cancelled') });
      }

      // own_invitation (400) role (403) ÖNCESİ — bkz. dosya başı nüans notu.
      if (invitation.trainerId === memberId) {
        return reply
          .code(400)
          .send({ status: 'own_invitation' as const, message: t('invite.ownInvitation') });
      }
      if (claims.role !== 'member') {
        return reply
          .code(403)
          .send({ status: 'forbidden' as const, message: t('invite.onlyMember') });
      }

      // Önden kontrol: üyenin zaten aktif PT'si varsa dostça 409 (race güvencesi
      // DB partial unique index; aşağıda P2002 da 409'a çevrilir).
      const existingActive = await app.prisma.trainerMember.findFirst({
        where: { memberId, endedAt: null, trainer: { deletedAt: null } },
        select: { id: true },
      });
      if (existingActive !== null) {
        return alreadyHasTrainer(reply);
      }

      const now = new Date();
      try {
        await app.prisma.$transaction(async (tx) => {
          // Atomik tek-kullanım: yalnızca hâlâ pending olan satırı kabul et.
          const accepted = await tx.invitation.updateMany({
            where: { id: invitation.id, status: 'pending' },
            data: { status: 'accepted', acceptedAt: now, acceptedByUserId: memberId },
          });
          // Race kaybı (count=0): bu arada accepted/expired/cancelled olmuş.
          if (accepted.count === 0) {
            throw new InvitationRaceLostError();
          }

          await createPtMemberRelation(tx, invitation.trainerId, memberId);

          await logAuditEvent(tx, {
            userId: memberId,
            eventType: 'invitation_accepted',
            metadata: { ip: req.ip, invitationId: invitation.id },
          });
        });
      } catch (err) {
        // Eşzamanlı başka kabul daveti aldı → 409 (zaten kullanılmış).
        if (err instanceof InvitationRaceLostError) {
          return reply
            .code(409)
            .send({ status: 'already_used' as const, message: t('invite.alreadyUsed') });
        }
        // Aktif PT tekliği ihlali (race) → 409 (zaten bir PT'ye bağlı).
        if (isUniqueViolation(err)) {
          return alreadyHasTrainer(reply);
        }
        throw err;
      }

      return reply.code(200).send({
        trainerId: invitation.trainerId,
        trainerFirstName: invitation.trainer.firstName,
        trainerLastName: invitation.trainer.lastName,
      });
    },
  );
};
