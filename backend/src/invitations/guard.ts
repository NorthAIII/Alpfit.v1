/**
 * Trainer-only rol guard (TASK-1.23).
 *
 * Davet endpoint'leri (`/invitations` create/list/cancel) yalnızca trainer
 * rolündeki kullanıcıya açıktır. `app.authenticate` (middleware) zaten geçerli
 * + aktif access token'ı garanti eder; bu helper onun üzerine rol kontrolü
 * koyar. Rol JWT'de imzalı (`AccessTokenClaims.role`) — güvenilir.
 *
 * Kullanım (route handler başında):
 *   if (!ensureTrainer(req, reply)) return reply;
 *
 * Trainer değilse 403 gönderir ve `false` döner (handler erken çıkar).
 */
import { t } from '../i18n/index.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Trainer ise `true`; değilse 403 `roleForbidden` gönderip `false` döner. */
export function ensureTrainer(req: FastifyRequest, reply: FastifyReply): boolean {
  const claims = req.user as AccessTokenClaims;
  if (claims.role !== 'trainer') {
    reply.code(403).send({ status: 'forbidden' as const, message: t('auth.roleForbidden') });
    return false;
  }
  return true;
}
