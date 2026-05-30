/**
 * GET /invitations (TASK-1.23) — PT'nin bekleyen davetleri (trainer-only).
 *
 * Yetki: `Authorization: Bearer <accessToken>` + trainer rolü. PT'nin "Bekleyen
 * davetler" listesini besler (F1.1). Pagination yok — v1'de eş zamanlı bekleyen
 * davet sayısı düşüktür (~5); üst sınır pratik olarak gerekmez.
 *
 *   - 401 unauthorized : access token yok / geçersiz
 *   - 403 forbidden    : trainer değil
 *   - 200 [{ id, code, url, expiresAt }] : bekleyen davetler (en yeni önce)
 *
 * Lazy expiry: `status = 'pending'` çekilir, sonra `expiresAt < now` olanlar
 * `markIfExpired` ile `expired`'a çekilip listeden düşürülür (cron yok —
 * discuss-phase kararı). Süresi dolmuş davet response'a girmez.
 */
import { buildInvitationUrl } from '../invitations/code.js';
import { markIfExpired } from '../invitations/expiry.js';
import { ensureTrainer } from '../invitations/guard.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

export interface InvitationsListRoutesOptions {
  env: Pick<Env, 'APP_BASE_URL'>;
}

export const invitationsListRoutes =
  (opts: InvitationsListRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.get('/invitations', { preHandler: app.authenticate }, async (req, reply) => {
      if (!ensureTrainer(req, reply)) {
        return reply;
      }
      const claims = req.user as AccessTokenClaims;

      const pending = await app.prisma.invitation.findMany({
        where: { trainerId: claims.sub, status: 'pending' },
        select: { id: true, code: true, status: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      });

      // Lazy expiry: süresi dolanları expired'a çek + listeden düşür.
      const active: { id: string; code: string; expiresAt: Date }[] = [];
      for (const inv of pending) {
        const expired = await markIfExpired(app.prisma, inv);
        if (!expired) {
          active.push({ id: inv.id, code: inv.code, expiresAt: inv.expiresAt });
        }
      }

      return reply.code(200).send(
        active.map((inv) => ({
          id: inv.id,
          code: inv.code,
          url: buildInvitationUrl(opts.env.APP_BASE_URL, inv.code),
          expiresAt: inv.expiresAt.toISOString(),
        })),
      );
    });
  };
