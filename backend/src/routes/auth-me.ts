/**
 * GET /auth/me (TASK-1.20) — oturum sahibinin profili.
 *
 * `app.authenticate` ile korunur (geçerli access token zorunlu). Mobile
 * auto-login / "oturum hâlâ açık mı?" kontrolü bunu kullanır (TASK-1.33).
 * Middleware kullanıcının aktif (`deletedAt: null`) olduğunu zaten garanti
 * eder; handler yalnızca güncel profil alanlarını döner.
 *
 *   - 401 unauthorized : token yok / geçersiz / expired / yanlış tip / silinmiş
 *   - 200 { user }     : access token sahibinin profili
 */
import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const authMeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/auth/me', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;
    const user = await app.prisma.user.findFirst({
      where: { id: claims.sub, deletedAt: null },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneE164: true,
        gymName: true,
        certificateNote: true,
      },
    });
    // Middleware aktif kullanıcıyı garanti eder; yine de TOCTOU'ya karşı koru.
    if (user === null) {
      return reply.code(401).send({ status: 'unauthorized' as const });
    }
    return reply.code(200).send({ user });
  });
};
