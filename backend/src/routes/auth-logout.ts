/**
 * POST /auth/logout (TASK-1.22) — bu cihazdan çıkış (tek refresh token revoke).
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`). Mobile,
 * "Çıkış yap" akışında o cihazın current refresh token'ını gövdede yollar —
 * server hangi cihazın token'ı olduğunu tahmin etmek yerine açıkça alır
 * (last-used tracking yerine basit body parametresi; TASK-1.22 dikkat notu).
 *
 *   Body: { refreshToken: string }
 *     - 401 unauthorized : access token yok / geçersiz (middleware)
 *     - 400 invalid      : gövde şeması hatalı
 *     - 403 forbidden    : token başka kullanıcıya ait (revoke edilemez)
 *     - 204              : token revoke edildi VEYA zaten geçersiz (idempotent)
 *
 * Idempotency: bilinmeyen ya da zaten revoke edilmiş token de 204 döner (hedef
 * "bu token artık geçerli değil" zaten sağlanmış) — yalnızca **gerçek** revoke
 * `user_logout` audit'i yazar. Race (eşzamanlı çift logout) atomik compare-and-set
 * (`updateMany ... WHERE revokedAt IS NULL`) ile çift audit'i önler.
 *
 * Not: access token stateless JWT'dir; logout sonrası 15dk TTL dolana kadar
 * teorik olarak geçerli kalır (kabul edilen trade-off; jti blacklist v1.5+).
 */
import { z } from 'zod';

import { hashRefreshToken } from '../auth/refresh-token.js';
import { t } from '../i18n/index.js';
import { logAuditEvent } from '../kvkk/audit.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

const BodySchema = z.object({ refreshToken: z.string().min(1) });

export const authLogoutRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/logout', { preHandler: app.authenticate }, async (req, reply) => {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        status: 'invalid' as const,
        message: t('validation.fieldRequired', { field: 'Refresh token' }),
      });
    }

    const claims = req.user as AccessTokenClaims;
    const tokenHash = hashRefreshToken(parsed.data.refreshToken);

    const row = await app.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, revokedAt: true },
    });

    // Bilinmeyen token → idempotent 204 (yapılacak bir şey yok, sızdırma yok).
    if (row === null) {
      return reply.code(204).send();
    }

    // Başka kullanıcının token'ı revoke edilemez (yetki ihlali).
    if (row.userId !== claims.sub) {
      return reply
        .code(403)
        .send({ status: 'forbidden' as const, message: t('auth.logoutTokenForbidden') });
    }

    // Zaten revoke → idempotent 204 (yeni audit yazma).
    if (row.revokedAt !== null) {
      return reply.code(204).send();
    }

    // Atomik compare-and-set: yalnızca hâlâ aktifse revoke et. Eşzamanlı ikinci
    // logout burada count=0 alır → çift audit yazılmaz (yine 204).
    const revoked = await app.prisma.refreshToken.updateMany({
      where: { id: row.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'logout' },
    });
    if (revoked.count === 1) {
      await logAuditEvent(app.prisma, {
        userId: claims.sub,
        eventType: 'user_logout',
        metadata: { ip: req.ip, refreshTokenId: row.id },
      });
    }

    return reply.code(204).send();
  });
};
