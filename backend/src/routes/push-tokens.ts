/**
 * Push token yönetimi (TASK-3.06).
 *
 * POST   /push-tokens — cihaz token kayıt (member + trainer)
 * DELETE /push-tokens — çıkış/uninstall sonrası token sil
 *
 * Çoklu cihaz: upsert ile idempotent; aynı token tekrar gelirse platform güncellenir.
 * Ownership: DELETE WHERE userId = claims.sub — başka kullanıcının tokeni silinemez.
 * Token değeri log'a yazılmaz (cihazı tanımlayan identifier, PII benzeri davranış).
 */
import { deletePushTokenSchema, registerPushTokenSchema } from '@alpfit/shared';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const pushTokensRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /push-tokens ─────────────────────────────────────────────────────
  app.post('/push-tokens', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    const parsed = registerPushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const { token, platform } = parsed.data;

    // token @unique: aynı token tekrar gelirse platform güncellenebilir (cihaz değişimi).
    // userId güncellenmez — token başka bir userId'ye ait olsa da üzerine yazma yok;
    // eski kullanıcı uninstall ettiyse token zaten DELETE ile silinmiş olmalı.
    await app.prisma.pushToken.upsert({
      where: { token },
      create: { userId: claims.sub, token, platform },
      update: { platform },
    });

    return reply.code(201).send();
  });

  // ── DELETE /push-tokens ───────────────────────────────────────────────────
  app.delete('/push-tokens', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    const parsed = deletePushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const { token } = parsed.data;

    // WHERE userId = sub AND token = body.token — ownership guarantee.
    // Token bulunamazsa veya başka kullanıcıya aitse deleteMany count=0 döner → yine 204 (idempotent).
    await app.prisma.pushToken.deleteMany({
      where: { userId: claims.sub, token },
    });

    return reply.code(204).send();
  });
};
