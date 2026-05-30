/**
 * POST /invitations (TASK-1.23) — PT davet linki üretir (trainer-only).
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`) + trainer
 * rolü (`ensureTrainer`). Üye/gym_owner → 403. Gövde gerektirmez (PT zaten
 * authenticated; davet hedef üyeyi içermez — F1.1 "link sadece kod içerir").
 *
 *   - 401 unauthorized : access token yok / geçersiz (middleware)
 *   - 403 forbidden    : trainer değil
 *   - 201 { id, code, url, expiresAt } : davet üretildi
 *
 * Kod 6 karakter Crockford base32; `code @unique` ihlalinde (P2002) en fazla
 * MAX_RETRY kez yeni kod denenir (çakışma olasılığı ~milyarda bir, retry pratikte
 * tetiklenmez ama garanti için var). Audit `invitation_created` — metadata'da
 * yalnızca `invitationId` (kod PII değil ama log'a yazılmaz; trainer ID hash'li).
 */
import { buildInvitationUrl, generateInvitationCode } from '../invitations/code.js';
import { ensureTrainer } from '../invitations/guard.js';
import { logAuditEvent } from '../kvkk/audit.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

/** Davet TTL — 30 gün (F1.1 "30 gün içinde kullanılmazsa otomatik iptal"). */
const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** `code @unique` çakışmasında yeniden deneme üst sınırı (pratikte tetiklenmez). */
const MAX_CODE_RETRY = 3;

export interface InvitationsCreateRoutesOptions {
  env: Pick<Env, 'APP_BASE_URL'>;
}

/** Prisma unique-constraint ihlali (`P2002`) — kod çakışması retry tetikler. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

export const invitationsCreateRoutes =
  (opts: InvitationsCreateRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.post('/invitations', { preHandler: app.authenticate }, async (req, reply) => {
      if (!ensureTrainer(req, reply)) {
        return reply;
      }
      const claims = req.user as AccessTokenClaims;
      const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

      let created: { id: string; code: string; expiresAt: Date } | null = null;
      for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
        const code = generateInvitationCode();
        try {
          created = await app.prisma.invitation.create({
            data: { code, trainerId: claims.sub, expiresAt },
            select: { id: true, code: true, expiresAt: true },
          });
          break;
        } catch (err) {
          // Kod çakıştıysa yeni kodla tekrar dene; başka hata yukarı fırlar.
          if (isUniqueViolation(err) && attempt < MAX_CODE_RETRY - 1) {
            continue;
          }
          throw err;
        }
      }
      // MAX_CODE_RETRY denemeyle üretilemediyse (astronomik olasılık) 500.
      if (created === null) {
        return reply.code(500).send({ status: 'error' as const });
      }

      await logAuditEvent(app.prisma, {
        userId: claims.sub,
        eventType: 'invitation_created',
        metadata: { ip: req.ip, invitationId: created.id },
      });

      return reply.code(201).send({
        id: created.id,
        code: created.code,
        url: buildInvitationUrl(opts.env.APP_BASE_URL, created.code),
        expiresAt: created.expiresAt.toISOString(),
      });
    });
  };
