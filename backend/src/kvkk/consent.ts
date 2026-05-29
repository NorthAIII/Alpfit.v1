/**
 * KVKK rıza yönetimi (TASK-1.14).
 *
 * Schema kararı (DECISIONS.md "2026-05-29 — TASK-1.14"):
 *   - ConsentRecord append-only event log; UPDATE/DELETE convention olarak yasak.
 *   - Geri çekme = yeni `revoked` event; verme = yeni `granted` event.
 *   - User.kvkkConsentAt / healthConsentAt **denormalized cache** — truth source
 *     ConsentRecord. recordConsent() tek transaction'da ikisini de günceller ki
 *     drift olmasın (kvkk_aydinlatma / saglik_verisi tipleri için; pazarlama
 *     v1'de User'a cache'lenmez).
 *
 * Çağrı kuralı (TASK-1.20+ profil create + Ayarlar > Gizlilik):
 *   await recordConsent(prisma, {
 *     userId,
 *     consentType: 'kvkk_aydinlatma',
 *     eventType: 'granted',
 *     textVersion: 'v2026-05-29',          // KVKK.md'deki güncel metin sürümü
 *     ipAddress: req.ip,                    // KVKK denetim için bilinçli
 *     userAgent: req.headers['user-agent'], // toplanır; Sentry'ye gitmez
 *   });
 */
import { ConsentEventType as ConsentEventTypeEnum } from '../generated/prisma/enums.js';

import type { PrismaClient } from '../db/prisma.js';
import type { ConsentEventType, ConsentType } from '../generated/prisma/enums.js';

export interface RecordConsentArgs {
  userId: string;
  consentType: ConsentType;
  eventType: ConsentEventType;
  /** Hukuki metin sürümü, tarih-bazlı (örn. "v2026-05-29"). */
  textVersion: string;
  /** KVKK denetim — bilinçli toplanır; Sentry'ye GÖNDERİLMEZ. */
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Append-only consent event yazar ve User üzerindeki denormalized cache
 * alanını (kvkkConsentAt / healthConsentAt) tek transaction'da günceller.
 *
 * `granted` event → cache `occurredAt`; `revoked` veya `auto_revoked` → null.
 * `pazarlama_iletisim` tipi için User cache YOK — v1.5'te ayrı alan eklenir.
 */
export async function recordConsent(
  prisma: PrismaClient,
  args: RecordConsentArgs,
): Promise<{ id: string; occurredAt: Date }> {
  return prisma.$transaction(async (tx) => {
    const record = await tx.consentRecord.create({
      data: {
        userId: args.userId,
        consentType: args.consentType,
        eventType: args.eventType,
        textVersion: args.textVersion,
        ipAddress: args.ipAddress ?? null,
        userAgent: args.userAgent ?? null,
      },
      select: { id: true, occurredAt: true },
    });

    const cacheValue: Date | null =
      args.eventType === ConsentEventTypeEnum.granted ? record.occurredAt : null;

    if (args.consentType === 'kvkk_aydinlatma') {
      await tx.user.update({
        where: { id: args.userId },
        data: { kvkkConsentAt: cacheValue },
      });
    } else if (args.consentType === 'saglik_verisi') {
      await tx.user.update({
        where: { id: args.userId },
        data: { healthConsentAt: cacheValue },
      });
    }
    // pazarlama_iletisim → User cache yok; ileride alan eklendiğinde burada güncellenir.

    return record;
  });
}

/**
 * Belirli bir rıza tipinin **şu anki** durumunu döner — append-only event
 * log'un en son satırı `granted` ise true.
 *
 * Truth source bu sorgudur; User.kvkkConsentAt / healthConsentAt yalnızca
 * UI/hot-path için cache'tir (recordConsent ikisini birlikte günceller).
 */
export async function getActiveConsent(
  prisma: PrismaClient,
  userId: string,
  consentType: ConsentType,
): Promise<boolean> {
  const latest = await prisma.consentRecord.findFirst({
    where: { userId, consentType },
    orderBy: { occurredAt: 'desc' },
    select: { eventType: true },
  });
  return latest?.eventType === ConsentEventTypeEnum.granted;
}
