/**
 * POST /auth/logout-all (TASK-1.22) — tüm cihazlardan çıkış.
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`). Kullanıcının
 * TÜM aktif (`revokedAt IS NULL`) refresh token'larını tek `updateMany` ile batch
 * revoke eder (`revokedReason: 'logout_all'`). Mobile "Tüm cihazlardan çıkış"
 * akışının backend tarafı (F1.1 oturum yönetimi).
 *
 *   - 401 unauthorized : access token yok / geçersiz (middleware)
 *   - 204              : tüm aktif refresh token'lar revoke edildi
 *
 * Audit: `user_logout_all` her zaman yazılır (kullanıcının açık güvenlik eylemi),
 * metadata'da kaç token revoke edildiği (`count`) tutulur — PII yok.
 *
 * Not: access token stateless JWT'dir; logout-all access token'ı revoke ETMEZ,
 * mevcut access token'lar 15dk TTL dolana kadar geçerli kalır (kabul edilen
 * trade-off; jti blacklist v1.5+). Yeni token alınması artık mümkün değildir
 * (tüm refresh'ler düştü).
 */
import { logAuditEvent } from '../kvkk/audit.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const authLogoutAllRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/logout-all', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    const { count } = await app.prisma.refreshToken.updateMany({
      where: { userId: claims.sub, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'logout_all' },
    });

    await logAuditEvent(app.prisma, {
      userId: claims.sub,
      eventType: 'user_logout_all',
      metadata: { ip: req.ip, count },
    });

    return reply.code(204).send();
  });
};
