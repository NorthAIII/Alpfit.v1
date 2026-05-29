/**
 * POST /auth/profile (TASK-1.20) — yeni üye/PT hesabı oluşturma + JWT issue.
 *
 * Yetki: `Authorization: Bearer <registrationToken>` (OTP verify'in "yeni üye"
 * yolunda verilir; `sub` = doğrulanmış telefon). OTP kodu gövdede **taşınmaz** —
 * telefon sahipliği jetondan gelir, böylece kod ağ üzerinde iki kez gezmez
 * (DECISIONS "TASK-1.20").
 *
 *   Body: { role, firstName, lastName, kvkkConsent, healthConsent?, gymName?, certificateNote? }
 *     - 401 unauthorized  : jeton yok / geçersiz / expired / yanlış tip
 *     - 400 invalid       : gövde şeması hatalı
 *     - 403 kvkk_required : kvkkConsent !== true (zorunlu KVKK aydınlatma rızası)
 *     - 409 phone_taken   : telefon zaten kayıtlı (giriş akışına yönlendir)
 *     - 201 { accessToken, user } : hesap açıldı, access token verildi
 *
 * Atomiklik (test kriteri): User + ConsentRecord(lar) + AuditLog tek
 * `$transaction`'da yazılır — biri fail ederse hepsi rollback. `refreshToken`
 * TASK-1.21'de eklenir. v1 onboarding yalnızca `member`/`trainer` açar
 * (`gym_owner` UI yok — 3 rol mimarisinde model slot'u korunur ama kayıt yolu yok).
 */
import { parseTrPhone } from '@alpfit/shared';
import { z } from 'zod';

import { issueAccessToken } from '../auth/jwt.js';
import { t } from '../i18n/index.js';
import { logAuditEvent } from '../kvkk/audit.js';
import { KVKK_TEXT_VERSION } from '../kvkk/consent.js';

import type { Role } from '../generated/prisma/enums.js';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

const BodySchema = z.object({
  role: z.enum(['member', 'trainer']),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  kvkkConsent: z.boolean(),
  healthConsent: z.boolean().optional(),
  gymName: z.string().trim().min(1).max(120).optional(),
  certificateNote: z.string().trim().min(1).max(500).optional(),
});

/** Prisma unique-constraint ihlali (`P2002`) — telefon yarış koşulunda 409. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

function unauthorized(reply: FastifyReply): FastifyReply {
  return reply.code(401).send({ status: 'unauthorized' as const, message: t('auth.tokenInvalid') });
}

export const authProfileRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/profile', async (req: FastifyRequest, reply: FastifyReply) => {
    // 1) Kayıt jetonu doğrula. Tip 'registration' olmalı (access jetonu reddedilir).
    try {
      await req.jwtVerify();
    } catch {
      return unauthorized(reply);
    }
    if (req.user.typ !== 'registration') {
      return unauthorized(reply);
    }
    const phoneE164 = req.user.sub;
    // Jeton sub'ı verify'de E.164 normalize edilmişti; savunmacı olarak yeniden doğrula.
    if (!parseTrPhone(phoneE164).valid) {
      return unauthorized(reply);
    }

    // 2) Gövde şeması.
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        status: 'invalid' as const,
        message: t('validation.fieldRequired', { field: 'Profil' }),
      });
    }
    const body = parsed.data;

    // 3) KVKK aydınlatma zorunlu rıza (sağlık rızası opsiyonel).
    if (body.kvkkConsent !== true) {
      return reply
        .code(403)
        .send({ status: 'kvkk_required' as const, message: t('auth.kvkkConsentRequired') });
    }

    // 4) Telefon zaten aktif kullanıcıya mı bağlı? (F1.1: "zaten kayıtlı, giriş yap").
    const existing = await app.prisma.user.findFirst({
      where: { phoneE164, deletedAt: null },
      select: { id: true },
    });
    if (existing !== null) {
      return reply
        .code(409)
        .send({ status: 'phone_taken' as const, message: t('auth.phoneAlreadyRegistered') });
    }

    // 5) Atomik create: User + ConsentRecord(lar) + audit. Biri fail → rollback.
    const now = new Date();
    const grantHealth = body.healthConsent === true;
    const userAgent = req.headers['user-agent'] ?? null;

    let user: {
      id: string;
      role: Role;
      firstName: string;
      lastName: string;
      phoneE164: string;
      gymName: string | null;
      certificateNote: string | null;
    };
    try {
      user = await app.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            phoneE164,
            role: body.role,
            firstName: body.firstName,
            lastName: body.lastName,
            gymName: body.gymName ?? null,
            certificateNote: body.certificateNote ?? null,
            // Denormalized cache; truth source ConsentRecord (recordConsent deseni).
            kvkkConsentAt: now,
            healthConsentAt: grantHealth ? now : null,
          },
          select: {
            id: true,
            role: true,
            firstName: true,
            lastName: true,
            phoneE164: true,
            gymName: true,
            certificateNote: true,
          },
        });

        await tx.consentRecord.create({
          data: {
            userId: created.id,
            consentType: 'kvkk_aydinlatma',
            eventType: 'granted',
            textVersion: KVKK_TEXT_VERSION,
            ipAddress: req.ip,
            userAgent,
          },
        });
        if (grantHealth) {
          await tx.consentRecord.create({
            data: {
              userId: created.id,
              consentType: 'saglik_verisi',
              eventType: 'granted',
              textVersion: KVKK_TEXT_VERSION,
              ipAddress: req.ip,
              userAgent,
            },
          });
        }

        await logAuditEvent(tx, {
          userId: created.id,
          eventType: 'user_created',
          metadata: { ip: req.ip },
        });
        await logAuditEvent(tx, {
          userId: created.id,
          eventType: 'consent_granted',
          metadata: { ip: req.ip, consentType: 'kvkk_aydinlatma', textVersion: KVKK_TEXT_VERSION },
        });
        if (grantHealth) {
          await logAuditEvent(tx, {
            userId: created.id,
            eventType: 'consent_granted',
            metadata: { ip: req.ip, consentType: 'saglik_verisi', textVersion: KVKK_TEXT_VERSION },
          });
        }

        return created;
      });
    } catch (err) {
      // verify ↔ profile arası yarışta unique telefon ihlali → 409 (sızdırmaz).
      if (isUniqueViolation(err)) {
        return reply
          .code(409)
          .send({ status: 'phone_taken' as const, message: t('auth.phoneAlreadyRegistered') });
      }
      throw err;
    }

    const accessToken = issueAccessToken(app, { id: user.id, role: user.role });
    return reply.code(201).send({ accessToken, user });
  });
};
