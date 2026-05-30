/**
 * PT ↔ Üye ilişki invariant'ları (TASK-1.13 placeholder → TASK-1.24 dolduruldu).
 *
 * Davet kabul akışı (TASK-1.24) bu helper'ları kullanır. Invariant
 * application katmanında ifade edilir ve DB'deki partial unique index ile
 * birlikte 2 katmanlı garanti verir.
 *
 * DB-level invariant (raw SQL migration 20260529190917):
 *   CREATE UNIQUE INDEX "TrainerMember_memberId_active_unique"
 *     ON "TrainerMember" ("memberId") WHERE "endedAt" IS NULL;
 *
 * Application-level invariant (bu modül): yeni aktif ilişki kurulmadan
 * önce mevcut bir aktif ilişki var mı diye kontrol eder. DB constraint
 * son güvence (eşzamanlı kabulde P2002 fırlar); bu yardımcılar daha
 * okunaklı bir hata mesajı ve önden kontrol sağlar.
 *
 * Tüm helper'lar `Pick<PrismaClient, 'trainerMember'>` alır → hem normal
 * client hem `$transaction` tx client'ı geçer (accept atomik transaction'da
 * çağrılır).
 */
import type { PrismaClient } from '../db/prisma.js';

/** `trainerMember` erişimini taşıyan minimal yapısal tip (tx uyumlu). */
export type TrainerMemberClient = Pick<PrismaClient, 'trainerMember'>;

/** Üyenin aktif PT'sinin özet bilgisi (üye kime bağlandığını görsün). */
export interface ActiveTrainerSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export class ActiveTrainerRelationExistsError extends Error {
  constructor(public readonly memberId: string) {
    super(`Member ${memberId} already has an active trainer relation`);
    this.name = 'ActiveTrainerRelationExistsError';
  }
}

/**
 * Üyenin aktif (endedAt IS NULL) PT'sini döner; yoksa `null`.
 * Soft-deleted PT'ler de filtrelenir (ilişki bitmemiş olsa bile aktif
 * sayılmaz — PT hesabı yok sayılır).
 */
export async function getActivePtForMember(
  client: TrainerMemberClient,
  memberId: string,
): Promise<ActiveTrainerSummary | null> {
  const relation = await client.trainerMember.findFirst({
    where: { memberId, endedAt: null, trainer: { deletedAt: null } },
    select: { trainer: { select: { id: true, firstName: true, lastName: true } } },
  });
  return relation?.trainer ?? null;
}

/**
 * Üyenin aktif PT ilişkisi varsa `ActiveTrainerRelationExistsError` fırlatır.
 * Soft-deleted PT ilişkisi "aktif" sayılmaz (üye yeni PT'ye bağlanabilir).
 * Davet kabul (TASK-1.24) öncesi önden kontrol; DB partial unique index
 * eşzamanlı kabulde son güvencedir.
 */
export async function assertNoActivePt(
  client: TrainerMemberClient,
  memberId: string,
): Promise<void> {
  const existing = await client.trainerMember.findFirst({
    where: { memberId, endedAt: null, trainer: { deletedAt: null } },
    select: { id: true },
  });
  if (existing) {
    throw new ActiveTrainerRelationExistsError(memberId);
  }
}

/**
 * Geriye dönük uyumlu ad (TASK-1.13 relations.test.ts). `assertNoActivePt`
 * ile aynı davranış.
 */
export const assertSingleActivePtForMember = assertNoActivePt;

/**
 * Yeni aktif PT-üye ilişkisi kurar (`endedAt` default null = aktif).
 * Üyenin zaten aktif ilişkisi varsa partial unique index P2002 fırlatır —
 * çağıran bunu 409'a çevirir. Atomik kabul transaction'ı içinde çağrılır.
 */
export async function createPtMemberRelation(
  client: TrainerMemberClient,
  trainerId: string,
  memberId: string,
): Promise<{ id: string; trainerId: string; memberId: string; startedAt: Date }> {
  return client.trainerMember.create({
    data: { trainerId, memberId },
    select: { id: true, trainerId: true, memberId: true, startedAt: true },
  });
}
