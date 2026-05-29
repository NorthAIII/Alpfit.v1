/**
 * KVKK audit log (TASK-1.14).
 *
 * Tasarım kararı (DECISIONS.md "2026-05-29 — TASK-1.14"):
 *   - Append-only event log; UPDATE/DELETE convention olarak yasak.
 *   - Ham `userId` YAZILMAZ — sha256 prefix 12 hex (broad disclosure önler,
 *     correlation için yeterli). pii-scrubber.ts'teki hashUserId ile **aynı
 *     algoritma**: AuditLog korelasyonu Sentry event'leriyle hizalanır.
 *   - metadata Json? PII içeremez — zod **whitelist** validator dar bir alan
 *     kümesine izin verir (`.strict()` ile bilinmeyen anahtarlar reddedilir).
 *
 * KVKK denetim taleplerinde "şu kullanıcı şu zaman şu eylemi yaptı mı?"
 * sorusu hash + occurredAt + eventType üzerinden cevaplanabilir.
 *
 * Çağrı kuralı: helper `logAuditEvent()` dışında **doğrudan**
 * `prisma.auditLog.create(...)` yasak — risk-mitigation (TASK-1.14 risk
 * planı). Lint custom kuralı ileride eklenir.
 */
import { z } from 'zod';

import { hashUserId } from '../observability/pii-scrubber.js';

import type { PrismaClient } from '../db/prisma.js';
import type { AuditEventType } from '../generated/prisma/enums.js';

/**
 * AuditLog.metadata için izinli alanlar (whitelist).
 *
 * `.strict()` bilinmeyen anahtarları reddeder → PII alanları (phone, weight,
 * email, name, kvkk consent, otp kodu, vs.) zod tarafından compile zamanı
 * yerine **runtime'da** yakalanır. Tipler dar: string + number (nested obje yok
 * → derin sızıntı yüzeyini düşürür).
 *
 * Yeni alan eklenmesi için bilinçli karar gerekir (risk-mitigation). Mevcut
 * v1 alanları:
 *
 * | Alan              | Hangi event(ler) için                              |
 * |-------------------|----------------------------------------------------|
 * | `ip`              | user_login, otp_*, refresh_* — KVKK denetim        |
 * | `deviceType`      | user_login, otp_sent — iOS/Android/web             |
 * | `userAgent`       | user_login — uzun olabilir, opsiyonel              |
 * | `invitationId`    | invitation_created, invitation_accepted            |
 * | `refreshTokenId`  | refresh_rotated, refresh_replay_detected, expired  |
 * | `consentType`     | consent_granted, consent_revoked                   |
 * | `textVersion`     | consent_granted, consent_revoked                   |
 * | `attemptCount`    | otp_verify_failed — kilit eşiğine doğru sayım     |
 * | `count`           | retention_purge — silinen kayıt sayısı            |
 * | `reason`          | user_logout_all, member_removed — kısa kod        |
 *
 * KASTEN BURADA YOK (PII): phone, email, name, firstName, lastName, otp,
 * weight, height, foodLog, measurements, password, token, kvkkConsent.
 */
export const AuditMetadataSchema = z
  .object({
    ip: z.string().optional(),
    deviceType: z.string().optional(),
    userAgent: z.string().optional(),
    invitationId: z.string().optional(),
    refreshTokenId: z.string().optional(),
    consentType: z.string().optional(),
    textVersion: z.string().optional(),
    attemptCount: z.number().optional(),
    count: z.number().optional(),
    reason: z.string().optional(),
  })
  .strict();

export type AuditMetadata = z.infer<typeof AuditMetadataSchema>;

export interface LogAuditEventArgs {
  /** Ham user ID — yazılmadan önce sha256 prefix 12 hex'e indirilir. */
  userId: string;
  eventType: AuditEventType;
  /** Opsiyonel; whitelist dışında alan varsa zod hata fırlatır (PII koruma). */
  metadata?: AuditMetadata;
}

/**
 * Append-only audit event yazar.
 *
 * - `userId` sha256 prefix 12 hex'e hash'lenir (ham ID DB'ye gitmez).
 * - `metadata` zod whitelist'ten geçer; bilinmeyen anahtar `ZodError` fırlatır.
 *   Bu, PII alanlarının (phone/weight/foodLog vb.) **çağırıda** bile yanlışlıkla
 *   verilmesini compile yerine runtime'da reddeden son güvencedir.
 *
 * @throws {ZodError} metadata whitelist ihlali — PII reddedildi.
 */
export async function logAuditEvent(
  prisma: PrismaClient,
  args: LogAuditEventArgs,
): Promise<{ id: string; userIdHash: string; occurredAt: Date }> {
  const validated: AuditMetadata | undefined =
    args.metadata === undefined ? undefined : AuditMetadataSchema.parse(args.metadata);

  const userIdHash = hashUserId(args.userId);

  // metadata `Json?` — undefined verirsek Prisma kolonu yazmaz (DB default
  // NULL); validated whitelist-geçmiş obje verirse onu yazar. `null` literal'i
  // Prisma 7 strict tipinde reddedildiği için `Prisma.DbNull` veya field-omit
  // gerekir; burada field-omit en sade çözüm.
  return prisma.auditLog.create({
    data: {
      userIdHash,
      eventType: args.eventType,
      ...(validated === undefined ? {} : { metadata: validated }),
    },
    select: { id: true, userIdHash: true, occurredAt: true },
  });
}
