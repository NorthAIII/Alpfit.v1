/**
 * Bildirim tercihleri (TASK-3.07).
 *
 * GET   /notification-preferences — üyenin mevcut tercihlerini döndür (yoksa default upsert)
 * PATCH /notification-preferences — tercihleri güncelle (partial)
 *
 * Yalnızca member rolü erişebilir. PT üyenin bildirim ayarını göremez/değiştiremez (M4 gizlilik kuralı).
 * Ownership: memberId = claims.sub (implicit — herkes yalnızca kendi tercihini okur/günceller).
 */
import { patchNotificationPreferenceSchema } from '@alpfit/shared';

import { t } from '../i18n/index.js';

import type { AccessTokenClaims } from '../auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';

const DEFAULTS = {
  reminderEnabled: true,
  comebackEnabled: true,
  systemEnabled: true,
  morningHour: 9,
  morningMinute: 0,
} as const;

export const notificationPreferencesRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /notification-preferences ─────────────────────────────────────────
  app.get('/notification-preferences', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const pref = await app.prisma.notificationPreference.upsert({
      where: { memberId: claims.sub },
      create: { memberId: claims.sub, ...DEFAULTS },
      update: {},
    });

    return reply.code(200).send({
      reminderEnabled: pref.reminderEnabled,
      comebackEnabled: pref.comebackEnabled,
      systemEnabled: pref.systemEnabled,
      morningHour: pref.morningHour,
      morningMinute: pref.morningMinute,
    });
  });

  // ── PATCH /notification-preferences ───────────────────────────────────────
  app.patch('/notification-preferences', { preHandler: app.authenticate }, async (req, reply) => {
    const claims = req.user as AccessTokenClaims;

    if (claims.role !== 'member') {
      return reply.code(403).send({ status: 'forbidden', message: t('auth.roleForbidden') });
    }

    const parsed = patchNotificationPreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: 'bad_request', message: parsed.error.message });
    }

    const pref = await app.prisma.notificationPreference.upsert({
      where: { memberId: claims.sub },
      create: { memberId: claims.sub, ...DEFAULTS, ...parsed.data },
      update: parsed.data,
    });

    return reply.code(200).send({
      reminderEnabled: pref.reminderEnabled,
      comebackEnabled: pref.comebackEnabled,
      systemEnabled: pref.systemEnabled,
      morningHour: pref.morningHour,
      morningMinute: pref.morningMinute,
    });
  });
};
