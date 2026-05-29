/**
 * MockSmsProvider (TASK-1.17) — dev/staging SMS driver.
 *
 * Gerçek SMS göndermez; OTP'yi `dev_otp_log` tablosuna yazar (dev OTP lookup
 * endpoint'i buradan okur — `routes/internal-dev-otp.ts`) ve pino logger'a bir
 * satır düşer. **Production'da çağrılmaz** (Live driver kullanılır), bu yüzden
 * tablo production'da boş kalır.
 *
 * PII / KVKK: log satırında telefon `phoneE164` ve OTP `otpCode` alan adlarıyla
 * verilir — ikisi de `@alpfit/shared` PII_FIELDS listesinde olduğundan pino
 * redact (server.ts) ve Sentry scrubber bunları `[REDACTED]` yapar. Ham `code`
 * property adı hiçbir log/serialize yüzeyine yazılmaz (DECISIONS.md "TASK-1.17").
 */
import { randomUUID } from 'node:crypto';

import type { SmsProvider, SmsSendResult } from './sms-provider.js';
import type { PrismaClient } from '../db/prisma.js';
import type { FastifyBaseLogger } from 'fastify';

export interface MockSmsProviderDeps {
  /** `devOtpLog.create` arayüzünü taşıyan minimal yapısal tip (tx veya full client). */
  prisma: Pick<PrismaClient, 'devOtpLog'>;
  /** pino logger — redact path'leri PII'yi maskeler (server.ts buildLoggerConfig). */
  logger: FastifyBaseLogger;
}

export class MockSmsProvider implements SmsProvider {
  constructor(private readonly deps: MockSmsProviderDeps) {}

  async sendOtp(phoneE164: string, code: string, ttlSec: number): Promise<SmsSendResult> {
    await this.deps.prisma.devOtpLog.create({ data: { phoneE164, code, ttlSec } });

    // `otpCode` + `phoneE164` PII_FIELDS'te → pino redact `[REDACTED]` yapar.
    this.deps.logger.info({ phoneE164, otpCode: code, ttlSec }, '[MOCK SMS] otp queued');

    return { providerMessageId: `mock-${randomUUID()}` };
  }
}
