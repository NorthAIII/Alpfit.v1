/**
 * POST /auth/otp/send (TASK-1.18) — OTP gönderim endpoint'i.
 *
 *   Body: `{ phone: string }` (TR formatı; `parseTrPhone` ile doğrulanır)
 *     - 400 invalid_phone : geçersiz / TR-dışı numara (bilgi sızdırmaz)
 *     - 429 rate_limited  : aynı telefon 1dk içinde tekrar istedi (+ `Retry-After: 60`)
 *     - 200 { success, expiresInSec } : kod üretildi, MockSmsProvider'a verildi
 *
 * Akış: doğrula → rate slot al (atomik `SET NX`) → OTP üret → Redis'e yaz →
 * SMS provider'a ver → `otp_sent` audit event. Telefon varlığı send aşamasında
 * SIZDIRILMAZ (F1.1: "zaten kayıtlı" yönlendirmesi verify tarafında).
 *
 * Brute-force koruması (5 hatalı → 15dk kilit) TASK-1.19 verify'de.
 */
import { parseTrPhone } from '@alpfit/shared';
import { z } from 'zod';

import {
  OTP_RATE_LIMIT_SEC,
  OTP_TTL_SEC,
  generateOtp,
  storeOtp,
  tryAcquireSendSlot,
} from '../auth/otp.js';
import { t } from '../i18n/index.js';
import { logAuditEvent } from '../kvkk/audit.js';
import { createSmsProvider } from '../sms/index.js';

import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

export interface AuthOtpSendRoutesOptions {
  env: Pick<Env, 'SMS_PROVIDER'>;
}

const BodySchema = z.object({ phone: z.string().min(1) });

export const authOtpSendRoutes =
  (opts: AuthOtpSendRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    // SMS driver registration anında çözülür (env.SMS_PROVIDER): mock → dev_otp_log,
    // live → Yakın 5'e kadar fail-fast. Çağrı yapan kod yalnızca interface'i görür.
    const sms = createSmsProvider(opts.env, { prisma: app.prisma, logger: app.log });

    app.post('/auth/otp/send', async (req, reply) => {
      // 1) Body + telefon doğrulama. Hata mesajı numara varlığını sızdırmaz.
      const parsed = BodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ status: 'invalid_phone' as const, message: t('validation.phoneInvalid') });
      }
      const { e164, valid } = parseTrPhone(parsed.data.phone);
      if (!valid) {
        return reply
          .code(400)
          .send({ status: 'invalid_phone' as const, message: t('validation.phoneInvalid') });
      }

      // 2) Telefon-bazlı rate limit (atomik). Zaten varsa 429 + Retry-After.
      const acquired = await tryAcquireSendSlot(app.redis, e164);
      if (!acquired) {
        reply.header('Retry-After', String(OTP_RATE_LIMIT_SEC));
        return reply
          .code(429)
          .send({ status: 'rate_limited' as const, message: t('auth.otpRateLimited') });
      }

      // 3) OTP üret → Redis'e yaz → provider'a ver.
      const code = generateOtp();
      await storeOtp(app.redis, e164, code);
      await sms.sendOtp(e164, code, OTP_TTL_SEC);

      // 4) KVKK audit (append-only). userId yok (pre-auth) → telefon subject
      //    olarak hash'lenir (ham telefon DB'ye gitmez). ip denetim için saklanır.
      await logAuditEvent(app.prisma, {
        userId: e164,
        eventType: 'otp_sent',
        metadata: { ip: req.ip },
      });

      return reply.code(200).send({ success: true as const, expiresInSec: OTP_TTL_SEC });
    });
  };
