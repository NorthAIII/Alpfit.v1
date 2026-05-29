/**
 * POST /auth/otp/verify (TASK-1.19) — OTP doğrulama + brute-force kilidi.
 *
 *   Body: `{ phone: string, code: string }`
 *     - 400 invalid_phone : geçersiz / TR-dışı numara (bilgi sızdırmaz)
 *     - 423 locked        : telefon 15dk brute-force kilidi altında (+ `Retry-After`)
 *     - 410 expired       : aktif OTP yok (süresi doldu / zaten tüketildi)
 *     - 401 invalid_code  : kod yanlış (deneme sayacı arttı, < 5)
 *     - 423 locked        : bu hatalı deneme 5'e ulaştı → telefon kilitlendi
 *     - 200 mevcut üye  : { verified, userExists:true, isNew:false, accessToken, refreshToken, expiresAt }
 *     - 200 yeni üye    : { verified, userExists:false, isNew:true, registrationToken }
 *
 * F1.1 PRD: "5 hatalı kod girişinden sonra 15 dakika kilit". OTP doğru kod
 * doğrulanınca atomik tüketilir; ardından (TASK-1.20):
 *   - **mevcut aktif kullanıcı** → giriş: `accessToken` (15dk) + `user_login` audit,
 *   - **yeni kullanıcı** → `registrationToken` (10dk); profil `POST /auth/profile`
 *     ile bu jeton üzerinden açılır (kod tekrar gönderilmez). Mevcut üye girişinde
 *     ayrıca 30 günlük **refresh token** (yeni aile) basılır (TASK-1.21).
 */
import { parseTrPhone } from '@alpfit/shared';
import { z } from 'zod';

import { issueAccessToken, issueRegistrationToken } from '../auth/jwt.js';
import {
  OTP_MAX_ATTEMPTS,
  clearAttempts,
  codesMatch,
  consumeOtp,
  getLockoutTtl,
  lockoutPhone,
  peekOtp,
  registerFailedAttempt,
} from '../auth/otp.js';
import { issueRefreshToken } from '../auth/refresh-token.js';
import { t } from '../i18n/index.js';
import { logAuditEvent } from '../kvkk/audit.js';

import type { FastifyPluginAsync } from 'fastify';

const BodySchema = z.object({ phone: z.string().min(1), code: z.string().min(1) });

export const authOtpVerifyRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/otp/verify', async (req, reply) => {
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

    // 2) Kilit önce devreye girer — kilitliyken doğru kod bile reddedilir.
    const lockTtl = await getLockoutTtl(app.redis, e164);
    if (lockTtl !== null) {
      await logAuditEvent(app.prisma, {
        userId: e164,
        eventType: 'otp_verify_failed',
        metadata: { ip: req.ip, reason: 'locked' },
      });
      reply.header('Retry-After', String(lockTtl));
      return reply
        .code(423)
        .send({ status: 'locked' as const, message: t('auth.otpTooManyAttempts') });
    }

    // 3) Aktif OTP kaydı yoksa süresi dolmuş / zaten tüketilmiş.
    const record = await peekOtp(app.redis, e164);
    if (record === null) {
      return reply.code(410).send({ status: 'expired' as const, message: t('auth.otpExpired') });
    }

    // 4) Kod yanlış → atomik sayaç arttır. Eşiğe ulaştıysa kilitle (423), yoksa 401.
    if (!codesMatch(parsed.data.code, record.code)) {
      const attemptCount = await registerFailedAttempt(app.redis, e164);
      await logAuditEvent(app.prisma, {
        userId: e164,
        eventType: 'otp_verify_failed',
        metadata: { ip: req.ip, attemptCount },
      });

      if (attemptCount >= OTP_MAX_ATTEMPTS) {
        await lockoutPhone(app.redis, e164);
        const ttl = await getLockoutTtl(app.redis, e164);
        if (ttl !== null) {
          reply.header('Retry-After', String(ttl));
        }
        return reply
          .code(423)
          .send({ status: 'locked' as const, message: t('auth.otpTooManyAttempts') });
      }

      return reply
        .code(401)
        .send({ status: 'invalid_code' as const, message: t('auth.otpInvalid') });
    }

    // 5) Kod doğru → atomik tüket. null dönerse concurrent başka istek tüketmiş
    //    (race) → bu istek için OTP artık yok = süresi dolmuş davranışı.
    const consumed = await consumeOtp(app.redis, e164);
    if (consumed === null) {
      return reply.code(410).send({ status: 'expired' as const, message: t('auth.otpExpired') });
    }
    await clearAttempts(app.redis, e164);

    // 6) Tarihsel dev_otp_log kaydını consumed olarak işaretle (production'da
    //    tablo boş — Live provider row üretmez → no-op).
    const devRow = await app.prisma.devOtpLog.findFirst({
      where: { phoneE164: e164, consumedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (devRow) {
      await app.prisma.devOtpLog.update({
        where: { id: devRow.id },
        data: { consumedAt: new Date() },
      });
    }

    // 7) Kullanıcı var mı? Soft-delete'li hesap "yok" sayılır (`deletedAt: null`).
    const user = await app.prisma.user.findFirst({
      where: { phoneE164: e164, deletedAt: null },
      select: { id: true, role: true },
    });

    await logAuditEvent(app.prisma, {
      userId: e164,
      eventType: 'otp_verified',
      metadata: { ip: req.ip },
    });

    // 8a) Mevcut aktif kullanıcı → giriş: access + refresh (yeni aile) + audit.
    if (user !== null) {
      const accessToken = issueAccessToken(app, { id: user.id, role: user.role });
      const userAgent = req.headers['user-agent'];
      const refresh = await issueRefreshToken(app.prisma, {
        userId: user.id,
        deviceInfo: userAgent === undefined ? null : { userAgent },
      });
      await logAuditEvent(app.prisma, {
        userId: user.id,
        eventType: 'user_login',
        metadata: { ip: req.ip },
      });
      return reply.code(200).send({
        verified: true as const,
        userExists: true as const,
        isNew: false as const,
        accessToken,
        refreshToken: refresh.token,
        expiresAt: refresh.expiresAt.toISOString(),
      });
    }

    // 8b) Yeni kullanıcı → kayıt jetonu (profil POST /auth/profile ile açılır).
    const registrationToken = issueRegistrationToken(app, e164);
    return reply.code(200).send({
      verified: true as const,
      userExists: false as const,
      isNew: true as const,
      registrationToken,
    });
  });
};
