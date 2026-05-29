/**
 * KVKK soft-delete + 30 gün retention deadline helper'ları (TASK-1.15).
 *
 * Üç tetikleyici, üç giriş noktası — hepsi aynı 30 günlük geri sayımı
 * `User.retentionDeadline` üzerinden işletir; retention-job (`retention-job.ts`)
 * deadline'ı geçen kullanıcıları purge eder.
 *
 *   1. `softDeleteUser` — Üye self-silme / PT veya admin kararıyla hesap
 *      kapatılır: `deletedAt` + `retentionDeadline = now + 30g`. Deadline
 *      geçince retention-job kullanıcıyı **anonimize** eder (PII alanları
 *      temizlenir, FK'lar korunur — DECISIONS 2026-05-29 "TASK-1.15").
 *   2. `endTrainerMember` — PT üyeyi çıkardığında: `TrainerMember.endedAt` set
 *      + üyenin `retentionDeadline = now + 30g`. `deletedAt` SET EDİLMEZ —
 *      üye hala app'i açabilir; bu deadline yalnızca **sağlık verisi** purge
 *      içindir (Yakın 4'te eklenir; v1'de purge listesi boş).
 *   3. `revokeHealthConsent` — KVKK Madde 6 açık rıza geri çekilir:
 *      ConsentRecord `revoked` event + üyenin `retentionDeadline = now + 30g`
 *      + AuditLog `consent_revoked`. Hesap kalır, sağlık verisi 30 gün
 *      içinde purge.
 *
 * Tasarım kararı (DECISIONS 2026-05-29 "TASK-1.15"):
 *   - Üç akış da User.retentionDeadline'ı paylaşır. Akıbet (anonimize vs
 *     sadece-sağlık-purge) `deletedAt`'ın null olup olmamasıyla belirlenir.
 *   - AuditLog event'leri `$transaction` içinde yazılır (audit ↔ state drift
 *     yok). `logAuditEvent` `AuditLogClient` yapısal tipiyle tx kabul eder.
 */
import { AuditEventType, ConsentEventType, ConsentType } from '../generated/prisma/enums.js';

import { logAuditEvent } from './audit.js';

import type { PrismaClient } from '../db/prisma.js';

/** KVKK retention penceresi — sağlık verisi rıza geri çekildikten / hesap
 * kapandıktan / PT ilişkisi sonlandıktan sonra fiili silme için tanınan süre.
 * Karar: 30 gün (KVKK.md "Veri Saklama Politikası"; PRD Onboarding F1.1). */
export const RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_PER_DAY);
}

export interface SoftDeleteUserArgs {
  userId: string;
  /** AuditLog metadata için kısa kod; whitelist'te `reason` olarak izinli
   * (audit.ts AuditMetadataSchema). PII içermez. */
  reason?: string;
  /** Test/cron deterministik için override; production'da new Date() yeterli. */
  now?: Date;
}

export interface SoftDeleteUserResult {
  deletedAt: Date;
  retentionDeadline: Date;
}

/**
 * Kullanıcıyı soft-delete eder ve 30 gün retention deadline'ı set eder.
 * Retention-job deadline geçince kullanıcıyı anonimize eder.
 *
 * Atomik: User.update + AuditLog.create aynı transaction. Drift yok.
 */
export async function softDeleteUser(
  prisma: PrismaClient,
  args: SoftDeleteUserArgs,
): Promise<SoftDeleteUserResult> {
  const now = args.now ?? new Date();
  const deadline = addDays(now, RETENTION_DAYS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: args.userId },
      data: { deletedAt: now, retentionDeadline: deadline },
      select: { deletedAt: true, retentionDeadline: true },
    });

    await logAuditEvent(tx, {
      userId: args.userId,
      eventType: AuditEventType.member_removed,
      ...(args.reason ? { metadata: { reason: args.reason } } : {}),
    });

    // user.deletedAt / retentionDeadline yukarıda set edildi → non-null garanti.
    return {
      deletedAt: user.deletedAt as Date,
      retentionDeadline: user.retentionDeadline as Date,
    };
  });
}

export interface EndTrainerMemberArgs {
  /** TrainerMember.id — sonlandırılacak aktif ilişki. */
  relationId: string;
  reason?: string;
  now?: Date;
}

export interface EndTrainerMemberResult {
  memberId: string;
  endedAt: Date;
  retentionDeadline: Date;
}

/**
 * PT-üye ilişkisini sonlandırır (`TrainerMember.endedAt = now`) ve üyenin
 * sağlık verisi retention deadline'ını 30 gün ileri set eder. Üyenin `deletedAt`
 * SET EDİLMEZ — hesap kalır; sadece sağlık verisi purge'lenir (Yakın 4'te
 * eklenecek tablolar).
 *
 * Atomik: relation update + user update + AuditLog `member_removed` aynı
 * transaction'da.
 */
export async function endTrainerMember(
  prisma: PrismaClient,
  args: EndTrainerMemberArgs,
): Promise<EndTrainerMemberResult> {
  const now = args.now ?? new Date();
  const deadline = addDays(now, RETENTION_DAYS);

  return prisma.$transaction(async (tx) => {
    const relation = await tx.trainerMember.update({
      where: { id: args.relationId },
      data: { endedAt: now },
      select: { memberId: true, endedAt: true },
    });

    const member = await tx.user.update({
      where: { id: relation.memberId },
      data: { retentionDeadline: deadline },
      select: { retentionDeadline: true },
    });

    await logAuditEvent(tx, {
      userId: relation.memberId,
      eventType: AuditEventType.member_removed,
      ...(args.reason ? { metadata: { reason: args.reason } } : {}),
    });

    return {
      memberId: relation.memberId,
      endedAt: relation.endedAt as Date,
      retentionDeadline: member.retentionDeadline as Date,
    };
  });
}

export interface RevokeHealthConsentArgs {
  userId: string;
  /** KVKK.md'deki güncel sağlık verisi rıza metni sürümü (tarih-bazlı). */
  textVersion: string;
  /** KVKK denetim için bilinçli toplanır — Sentry'ye GÖNDERİLMEZ
   * (pino redact + Sentry beforeSend `[REDACTED]`'ler). */
  ipAddress?: string;
  userAgent?: string;
  now?: Date;
}

export interface RevokeHealthConsentResult {
  retentionDeadline: Date;
}

/**
 * Sağlık verisi açık rızasını geri çeker (KVKK Madde 6 → kullanıcı talep
 * eder; UI: Ayarlar > Gizlilik > "KVKK rızamı geri çek"). 30 gün içinde
 * sağlık verisi (Yakın 4 tabloları) purge'lenir; hesap kalır.
 *
 * Atomik:
 *   1. ConsentRecord `revoked` event (append-only)
 *   2. User.healthConsentAt = null (denormalized cache)
 *   3. User.retentionDeadline = now + 30g
 *   4. AuditLog `consent_revoked`
 *
 * Not: Bu helper recordConsent()'ten farklı; recordConsent retentionDeadline
 * set etmez. Buradaki helper özellikle "sağlık rızası geri çekildi →
 * purge tetiklendi" akışı içindir.
 */
export async function revokeHealthConsent(
  prisma: PrismaClient,
  args: RevokeHealthConsentArgs,
): Promise<RevokeHealthConsentResult> {
  const now = args.now ?? new Date();
  const deadline = addDays(now, RETENTION_DAYS);

  return prisma.$transaction(async (tx) => {
    await tx.consentRecord.create({
      data: {
        userId: args.userId,
        consentType: ConsentType.saglik_verisi,
        eventType: ConsentEventType.revoked,
        textVersion: args.textVersion,
        ipAddress: args.ipAddress ?? null,
        userAgent: args.userAgent ?? null,
      },
    });

    const user = await tx.user.update({
      where: { id: args.userId },
      data: { healthConsentAt: null, retentionDeadline: deadline },
      select: { retentionDeadline: true },
    });

    await logAuditEvent(tx, {
      userId: args.userId,
      eventType: AuditEventType.consent_revoked,
      metadata: { consentType: ConsentType.saglik_verisi, textVersion: args.textVersion },
    });

    return { retentionDeadline: user.retentionDeadline as Date };
  });
}
