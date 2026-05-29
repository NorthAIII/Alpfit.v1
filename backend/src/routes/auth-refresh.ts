/**
 * POST /auth/refresh (TASK-1.21) — refresh token rotation + replay detection.
 *
 *   Body: `{ refreshToken: string }`
 *     - 400 invalid        : gövde şeması hatalı
 *     - 401 invalid_refresh: token DB'de yok / kullanıcı artık aktif değil
 *     - 401 expired        : token süresi dolmuş (`refresh_expired` audit)
 *     - 401 replay         : revoke edilmiş token tekrar geldi → AİLE iptal
 *                            (`refresh_replay_detected` audit)
 *     - 200                : { accessToken, refreshToken, expiresAt }
 *
 * rotate-on-use: her başarılı çağrı eski token'ı `revokedReason:'rotated'` yapar
 * ve aynı aileye (`familyId`) yeni token basar (chain `previousId` ile ilerler),
 * yeni access token (TASK-1.20) verir.
 *
 * Concurrent rotation race: rotation, atomik compare-and-set
 * (`updateMany ... WHERE id=? AND revokedAt IS NULL`) ile yapılır. İki istemci
 * aynı token'la aynı anda gelirse Postgres satır kilidi yalnızca birinde
 * count=1 verir; kaybeden count=0 alır ve **replay** muamelesi görür (aile
 * iptal). Bu bilinçli bir güvenlik tercihi: token yeniden-kullanımı = olası
 * ele geçirme → logout-all benzeri davranış. Maliyet (gerçek çift istek →
 * kullanıcı yeniden giriş) Risk planında kabul edildi (DECISIONS "TASK-1.21").
 *
 * Replay user notify: v1'de yalnızca audit + 401 (UI giriş ekranına yönlendirir).
 * In-app banner TASK-1.32; push/SMS uyarısı M4 fazında değerlendirilir.
 */
import { z } from 'zod';

import { issueAccessToken } from '../auth/jwt.js';
import { hashRefreshToken, issueRefreshToken } from '../auth/refresh-token.js';
import { t } from '../i18n/index.js';
import { logAuditEvent } from '../kvkk/audit.js';

import type { FastifyPluginAsync, FastifyReply } from 'fastify';

const BodySchema = z.object({ refreshToken: z.string().min(1) });

/** 401 gövdesi: `status` istemci ayrımı için, `message` çevrilmiş TR metin. */
function unauthorized(reply: FastifyReply, status: string, message: string): FastifyReply {
  return reply.code(401).send({ status, message });
}

export const authRefreshRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/refresh', async (req, reply) => {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        status: 'invalid' as const,
        message: t('validation.fieldRequired', { field: 'Refresh token' }),
      });
    }

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const now = new Date();
    const userAgent = req.headers['user-agent'];
    const deviceInfo = userAgent === undefined ? null : { userAgent };

    // Rotation tek transaction'da: oku → (replay/expired ele) → atomik
    // compare-and-set revoke → yeni token bas. Kararı transaction dışında
    // raporlarız (audit + response) — tx içinde reply.send yok.
    const outcome = await app.prisma.$transaction(async (tx) => {
      const row = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (row === null) {
        return { kind: 'invalid' as const };
      }

      // Zaten revoke edilmiş token tekrar geldi → replay. Ailenin tüm AKTİF
      // token'larını iptal et (compromise = aile bütünüyle düşer).
      if (row.revokedAt !== null) {
        await tx.refreshToken.updateMany({
          where: { familyId: row.familyId, revokedAt: null },
          data: { revokedAt: now, revokedReason: 'replay_detected' },
        });
        return { kind: 'replay' as const, refreshTokenId: row.id, userId: row.userId };
      }

      if (row.expiresAt.getTime() < now.getTime()) {
        return { kind: 'expired' as const, refreshTokenId: row.id, userId: row.userId };
      }

      // Atomik compare-and-set: yalnızca hâlâ aktifse revoke et. Concurrent
      // ikinci istek burada count=0 alır (satır kilidi serialize eder).
      const revoked = await tx.refreshToken.updateMany({
        where: { id: row.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'rotated' },
      });
      if (revoked.count === 0) {
        // Yarışı kaybettik: token bu an içinde başka istekçe rotate edildi →
        // yeniden-kullanım say, aileyi iptal et (replay ile aynı muamele).
        await tx.refreshToken.updateMany({
          where: { familyId: row.familyId, revokedAt: null },
          data: { revokedAt: now, revokedReason: 'replay_detected' },
        });
        return { kind: 'replay' as const, refreshTokenId: row.id, userId: row.userId };
      }

      // Kullanıcı hâlâ aktif mi? Soft-delete'li hesap rotation alamaz.
      const user = await tx.user.findFirst({
        where: { id: row.userId, deletedAt: null },
        select: { id: true, role: true },
      });
      if (user === null) {
        return { kind: 'invalid' as const };
      }

      const issued = await issueRefreshToken(tx, {
        userId: user.id,
        familyId: row.familyId,
        previousId: row.id,
        deviceInfo,
      });

      return { kind: 'rotated' as const, user, refreshTokenId: row.id, issued };
    });

    if (outcome.kind === 'invalid') {
      return unauthorized(reply, 'invalid_refresh', t('auth.refreshInvalid'));
    }

    if (outcome.kind === 'replay') {
      await logAuditEvent(app.prisma, {
        userId: outcome.userId,
        eventType: 'refresh_replay_detected',
        metadata: { ip: req.ip, refreshTokenId: outcome.refreshTokenId },
      });
      return unauthorized(reply, 'replay', t('auth.refreshReplay'));
    }

    if (outcome.kind === 'expired') {
      await logAuditEvent(app.prisma, {
        userId: outcome.userId,
        eventType: 'refresh_expired',
        metadata: { ip: req.ip, refreshTokenId: outcome.refreshTokenId },
      });
      return unauthorized(reply, 'expired', t('auth.refreshExpired'));
    }

    // Başarılı rotation.
    await logAuditEvent(app.prisma, {
      userId: outcome.user.id,
      eventType: 'refresh_rotated',
      metadata: { ip: req.ip, refreshTokenId: outcome.refreshTokenId },
    });
    const accessToken = issueAccessToken(app, { id: outcome.user.id, role: outcome.user.role });
    return reply.code(200).send({
      accessToken,
      refreshToken: outcome.issued.token,
      expiresAt: outcome.issued.expiresAt.toISOString(),
    });
  });
};
