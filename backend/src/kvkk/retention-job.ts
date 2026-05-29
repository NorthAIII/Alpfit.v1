/**
 * KVKK 30 gün retention purge job (TASK-1.15).
 *
 * Periyodik tetiklenir (host crontab → POST /admin/internal/retention-purge —
 * `_dev/docs/staging-retention-cron.md`). Çalışma:
 *
 *   1. `retentionDeadline IS NOT NULL AND retentionDeadline < now` olan
 *      kullanıcıları bulur.
 *   2. Her biri için `getDeletableTablesForUser(userId)` ile silinecek
 *      sağlık verisi satırlarını hard-delete eder.
 *      → v1'de bu liste BOŞ (M6 tabloları Yakın 4'te eklenecek). İmza
 *      şimdiden tanımlı; Yakın 4 task'ı sadece bu helper'a tablo ekler.
 *   3. `deletedAt IS NOT NULL` ise kullanıcıyı ANONİMİZE eder
 *      (DECISIONS 2026-05-29 "TASK-1.15"): firstName/lastName/profilePhotoUrl
 *      ve PT'ye özgü alanlar (gymName/certificateNote) null'a çekilir,
 *      `phoneE164 = 'deleted_<userIdHash>'` (global unique constraint için
 *      collision-safe). FK'lar bozulmaz; AuditLog `userIdHash` üzerinden
 *      sorgulanmaya devam eder.
 *   4. `retentionDeadline = null` set edilir (cycle complete; aynı kullanıcı
 *      tekrar işlenmez).
 *   5. Her purge işlemi `AuditLog.retention_purge` event'i yazar (whitelist
 *      metadata: `count` toplam, `reason` purge yolu).
 *
 * Dönüş: `RetentionPurgeReport` — kim purge edildi ve özet sayılar.
 */
import { createHash } from 'node:crypto';

import { AuditEventType } from '../generated/prisma/enums.js';

import { logAuditEvent } from './audit.js';

import type { PrismaClient } from '../db/prisma.js';

export interface RetentionPurgeReport {
  /** Toplam işlenen kullanıcı sayısı (anonimize + sadece-sağlık-purge). */
  processedCount: number;
  /** Anonimize edilen (yani `deletedAt IS NOT NULL` olanlar) kullanıcı sayısı. */
  anonymizedCount: number;
  /** Yalnızca sağlık verisi purge edilen kullanıcı sayısı (hesap kalır). */
  healthDataPurgedCount: number;
  /** Silinen sağlık verisi satırı toplamı (v1'de hep 0; Yakın 4'te > 0). */
  deletedHealthRowsCount: number;
}

/**
 * Bir kullanıcının silinmesi gereken sağlık verisi tablo + satırlarını döner.
 *
 * v1'de bu interface **kasten boş bir liste** döner — M6 tabloları (ölçümler,
 * yemek günlüğü) Yakın 4'te eklenir. Yakın 4 task'ı bu helper'a şu desenle
 * tablo ekler:
 *
 *   await tx.measurement.deleteMany({ where: { userId } });
 *   await tx.foodLog.deleteMany({ where: { userId } });
 *
 * Şu an boş döner ki retention-job şimdi de hata fırlatmadan çalışsın
 * (smoke garantisi).
 */
export async function purgeDeletableTablesForUser(
  _tx: PrismaClient,
  _userId: string,
): Promise<number> {
  // v1: silinecek sağlık verisi tablosu yok. Yakın 4'te bu blok genişler.
  // Underscore-prefix konvansiyonu: param imza şimdiden tanımlı kalır
  // (Yakın 4 sözleşme değişimi yok), TS noUnusedParameters geçer.
  return 0;
}

/**
 * `phoneE164` global unique constraint'i (TASK-1.13 schema) ile çakışmayan
 * deterministik anonim telefon değeri üretir. `deleted_<sha256-prefix-12>`
 * formatı E.164 olmadığı için canlı bir telefon ile asla çakışmaz (`+` ile
 * başlamaz). Aynı kullanıcı tekrar anonimize edilemez (idempotent — zaten
 * retentionDeadline null'a çekilir).
 */
function anonymizedPhone(userId: string): string {
  return `deleted_${createHash('sha256').update(userId).digest('hex').slice(0, 12)}`;
}

export interface RunRetentionPurgeArgs {
  /** Test/cron deterministik için override; production'da new Date() yeterli. */
  now?: Date;
}

/**
 * Retention deadline'ı geçen kullanıcıları işler. İdempotent: aynı kullanıcı
 * tekrar çalıştırmada işlenmez (deadline null'a çekilir).
 *
 * Her kullanıcı kendi transaction'ında işlenir — biri hata verirse diğerlerini
 * etkilemez. Toplu rapor `AuditLog.retention_purge` event'i ile yazılır
 * (metadata: `count` = işlenen sayı).
 */
export async function runRetentionPurge(
  prisma: PrismaClient,
  args: RunRetentionPurgeArgs = {},
): Promise<RetentionPurgeReport> {
  const now = args.now ?? new Date();

  const candidates = await prisma.user.findMany({
    where: { retentionDeadline: { not: null, lt: now } },
    select: { id: true, deletedAt: true },
  });

  let anonymizedCount = 0;
  let healthDataPurgedCount = 0;
  let deletedHealthRowsCount = 0;

  for (const candidate of candidates) {
    const isAnonymize = candidate.deletedAt !== null;

    const deleted = await prisma.$transaction(async (tx) => {
      const purgedRows = await purgeDeletableTablesForUser(tx as PrismaClient, candidate.id);

      if (isAnonymize) {
        await tx.user.update({
          where: { id: candidate.id },
          data: {
            firstName: '',
            lastName: '',
            profilePhotoUrl: null,
            gymName: null,
            certificateNote: null,
            phoneE164: anonymizedPhone(candidate.id),
            retentionDeadline: null,
          },
        });
      } else {
        // Sadece-sağlık-verisi purge: hesap kalır, deadline null'a çekilir.
        await tx.user.update({
          where: { id: candidate.id },
          data: { retentionDeadline: null },
        });
      }

      return purgedRows;
    });

    deletedHealthRowsCount += deleted;
    if (isAnonymize) {
      anonymizedCount += 1;
    } else {
      healthDataPurgedCount += 1;
    }
  }

  const processedCount = anonymizedCount + healthDataPurgedCount;

  // KVKK uyum: purge eyleminin kendisi audit log'a yazılır (şeffaflık).
  // userId yok (toplu eylem) → cron için sabit anonim sentinel kullanılır;
  // hash'lendiği için broad disclosure riski yok, sadece "retention-job" izi.
  await logAuditEvent(prisma, {
    userId: 'retention-job',
    eventType: AuditEventType.retention_purge,
    metadata: {
      count: processedCount,
      reason: `anonymized=${anonymizedCount},health_only=${healthDataPurgedCount},rows=${deletedHealthRowsCount}`,
    },
  });

  return {
    processedCount,
    anonymizedCount,
    healthDataPurgedCount,
    deletedHealthRowsCount,
  };
}
