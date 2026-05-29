/**
 * PT ↔ Üye ilişki invariant'ları (TASK-1.13).
 *
 * v1'de davet kabul akışı (TASK-1.24) bu helper'ları kullanacak. Şu an
 * minimal placeholder: invariant'ı application katmanında ifade eder ve
 * DB'deki partial unique index ile birlikte 2 katmanlı garanti verir.
 *
 * DB-level invariant (raw SQL migration 20260529190917):
 *   CREATE UNIQUE INDEX "TrainerMember_memberId_active_unique"
 *     ON "TrainerMember" ("memberId") WHERE "endedAt" IS NULL;
 *
 * Application-level invariant (bu modül): yeni aktif ilişki kurulmadan
 * önce mevcut bir aktif ilişki var mı diye kontrol eder. DB constraint
 * son güvence; bu yardımcı daha okunaklı bir hata mesajı sağlar.
 */
import type { PrismaClient } from '../db/prisma.js';

export class ActiveTrainerRelationExistsError extends Error {
  constructor(public readonly memberId: string) {
    super(`Member ${memberId} already has an active trainer relation`);
    this.name = 'ActiveTrainerRelationExistsError';
  }
}

/**
 * Üyenin aktif (endedAt IS NULL) PT ilişkisi varsa hata fırlatır.
 * TASK-1.24 davet kabul akışında çağrılır.
 */
export async function assertSingleActivePtForMember(
  prisma: PrismaClient,
  memberId: string,
): Promise<void> {
  const existing = await prisma.trainerMember.findFirst({
    where: { memberId, endedAt: null },
    select: { id: true },
  });
  if (existing) {
    throw new ActiveTrainerRelationExistsError(memberId);
  }
}
