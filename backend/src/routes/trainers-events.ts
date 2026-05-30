/**
 * GET /trainers/me/events?since=<ISO timestamp> (TASK-1.32) — PT'nin uygulama
 * açıkken yakaladığı in-app event akışı (trainer-only). Şu an tek event tipi:
 * `invitation_accepted` (üye davet kabul etti → PT'ye banner + liste tazeleme).
 *
 * Yetki: `Authorization: Bearer <accessToken>` (`app.authenticate`) + trainer
 * rolü (`ensureTrainer`). Mobile `use-pt-events` hook'u 20sn aralıkla poll eder
 * ve `since` olarak en son gördüğü `occurredAt`'ı geçirir.
 *
 * Kaynak kararı (DECISIONS.md "2026-05-29 — TASK-1.32"): event'ler **AuditLog'dan
 * DEĞİL `TrainerMember`'dan** üretilir. AuditLog `invitation_accepted` kaydı
 * **üyenin** `userIdHash`'ini tutar (PT'nin değil) + `trainerId`/isim içermez →
 * PT-scoped sorgu yapılamaz. v1'de yeni aktif `TrainerMember` satırı == davet
 * kabulü; `startedAt` event zamanı, `member` ilişkisi ismi verir. Push altyapısı
 * (APNs/FCM) M4'te kurulunca polling SSE/push'a taşınır (in-app banner aynı kalır).
 *
 *   - 400 bad_request : `since` verildi ama geçersiz tarih
 *   - 401 unauthorized: access token yok / geçersiz (middleware)
 *   - 403 forbidden   : trainer değil (ensureTrainer)
 *   - 200 [{ type: 'invitation_accepted', memberId, memberFirstName, occurredAt }]
 *         : `since`'ten SONRA (strict >) başlayan aktif ilişkiler, en yeni önce
 *
 * `since` opsiyonel: yoksa alt sınır uygulanmaz (ilk açılış / baseline). Cursor
 * strict `>` — istemci en son `occurredAt`'ı geçirince aynı event tekrar gelmez
 * (eşit-ms ihtimaline karşı istemci `memberId:occurredAt` ile de dedup eder).
 *
 * PII notu: `memberFirstName` bilinçli döner (PT zaten üye listesinde ismi görür;
 * `trainers-members` ile aynı gerekçe). Telefon/sağlık verisi DÖNMEZ.
 */
import { t } from '../i18n/index.js';
import { ensureTrainer } from '../invitations/guard.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

export const trainersEventsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { since?: string } }>(
    '/trainers/me/events',
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!ensureTrainer(req, reply)) {
        return reply;
      }
      const claims = req.user as AccessTokenClaims;

      // `since` opsiyonel; verilirse geçerli tarih olmalı (aksi halde 400).
      let since: Date | undefined;
      if (req.query.since !== undefined) {
        const parsed = new Date(req.query.since);
        if (Number.isNaN(parsed.getTime())) {
          return reply
            .code(400)
            .send({ status: 'bad_request' as const, message: t('events.invalidSince') });
        }
        since = parsed;
      }

      const rows = await app.prisma.trainerMember.findMany({
        where: {
          trainerId: claims.sub,
          endedAt: null,
          member: { deletedAt: null },
          ...(since === undefined ? {} : { startedAt: { gt: since } }),
        },
        select: {
          startedAt: true,
          member: { select: { id: true, firstName: true } },
        },
        orderBy: { startedAt: 'desc' },
      });

      return reply.code(200).send(
        rows.map((row) => ({
          type: 'invitation_accepted' as const,
          memberId: row.member.id,
          memberFirstName: row.member.firstName,
          occurredAt: row.startedAt.toISOString(),
        })),
      );
    },
  );
};
