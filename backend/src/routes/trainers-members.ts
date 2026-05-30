/**
 * GET /trainers/me/members (TASK-1.31) — PT'nin aktif üyeleri (trainer-only).
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`) + trainer
 * rolü (`ensureTrainer`). PT "Üyeler" sekmesindeki "Aktif üyeler" listesini
 * besler (F1.1). Aktif ilişki = `TrainerMember` satırı `endedAt: null` (PT üyeyi
 * çıkardığında `endedAt` set edilir, F5.1). Soft-deleted üye listeden düşer.
 *
 *   - 401 unauthorized : access token yok / geçersiz (middleware)
 *   - 403 forbidden    : trainer değil (ensureTrainer)
 *   - 200 [{ id, firstName, lastName, joinedAt }] : aktif üyeler (en yeni önce)
 *
 * PII notu: yalnızca isim alanları döner (PT zaten üye listesinde ismi görür);
 * telefon/sağlık verisi BURADA dönmez. Pagination yok — v1'de bir PT'nin aktif
 * üye sayısı düşük (~5-30); üst sınır pratik olarak gerekmez (invitations-list
 * ile aynı gerekçe).
 */
import { ensureTrainer } from '../invitations/guard.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const trainersMembersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/trainers/me/members', { preHandler: app.authenticate }, async (req, reply) => {
    if (!ensureTrainer(req, reply)) {
      return reply;
    }
    const claims = req.user as AccessTokenClaims;

    const rows = await app.prisma.trainerMember.findMany({
      where: { trainerId: claims.sub, endedAt: null, member: { deletedAt: null } },
      select: {
        startedAt: true,
        member: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return reply.code(200).send(
      rows.map((row) => ({
        id: row.member.id,
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        joinedAt: row.startedAt.toISOString(),
      })),
    );
  });
};
