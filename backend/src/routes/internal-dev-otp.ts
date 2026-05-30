/**
 * Dev OTP lookup endpoint (TASK-1.17) — yalnızca dev/staging.
 *
 *   GET /internal/dev-otp/:phoneE164
 *     - **Production'da 404** (NODE_ENV === 'production') — endpoint hiç var
 *       olmamış gibi davranır (saldırı yüzeyi 0; bunker-nginx production'da
 *       /internal/ proxy etmez, bu kod ikinci savunma katmanıdır).
 *     - Bearer auth (TASK-1.15 ADMIN_INTERNAL_TOKEN ile aynı token):
 *         503 → token env'de yok (yanlış konfigürasyon)
 *         401 → token eksik / yanlış
 *         404 → telefona ait OTP kaydı yok
 *         200 → son OTP kaydı (`otpCode` alanı plaintext döner — dev cihaz
 *               "OTP otomatik gir" akışı için, TASK-1.30)
 *
 * MockSmsProvider'ın `dev_otp_log` tablosuna yazdığı son OTP'yi okur. Mobile
 * dev build'inde otomatik OTP girişi için kullanılır; production build'de bu UI
 * kapalıdır ve endpoint zaten 404 döner.
 */
import { timingSafeEqual } from 'node:crypto';

import { extractBearer } from './bearer.js';

import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

export interface InternalDevOtpRoutesOptions {
  env: Pick<Env, 'NODE_ENV' | 'ADMIN_INTERNAL_TOKEN'>;
}

interface DevOtpParams {
  phoneE164: string;
}

export const internalDevOtpRoutes =
  (opts: InternalDevOtpRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.get<{ Params: DevOtpParams }>('/internal/dev-otp/:phoneE164', async (req, reply) => {
      // 1) Production'da endpoint yok.
      if (opts.env.NODE_ENV === 'production') {
        return reply.code(404).send({ status: 'not_found' as const });
      }

      // 2) Token konfigüre değilse devre dışı.
      const configured = opts.env.ADMIN_INTERNAL_TOKEN;
      if (!configured) {
        return reply.code(503).send({
          status: 'unconfigured' as const,
          message: 'ADMIN_INTERNAL_TOKEN not set; dev OTP lookup endpoint disabled.',
        });
      }

      // 3) Bearer auth.
      const provided = extractBearer(req.headers.authorization);
      if (
        !provided ||
        provided.length !== configured.length ||
        !timingSafeEqual(Buffer.from(provided), Buffer.from(configured))
      ) {
        return reply.code(401).send({ status: 'unauthorized' as const });
      }

      // 4) Son OTP kaydını döndür.
      const row = await app.prisma.devOtpLog.findFirst({
        where: { phoneE164: req.params.phoneE164 },
        orderBy: { createdAt: 'desc' },
        select: { code: true, ttlSec: true, createdAt: true, consumedAt: true },
      });

      if (!row) {
        return reply.code(404).send({ status: 'no_otp' as const });
      }

      // `otpCode` alan adı bilinçli: PII_FIELDS redact eder, ham `code` adı
      // log/Sentry yüzeyine sızmaz (DECISIONS.md "TASK-1.17").
      return reply.code(200).send({
        status: 'ok' as const,
        phoneE164: req.params.phoneE164,
        otpCode: row.code,
        ttlSec: row.ttlSec,
        createdAt: row.createdAt,
        consumedAt: row.consumedAt,
      });
    });
  };
