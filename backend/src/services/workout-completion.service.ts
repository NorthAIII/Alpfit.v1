/**
 * WorkoutCompletion service (TASK-2.04).
 *
 * Üyenin antrenman tamamlama kaydı — M3 streak motoruna sinyal sağlar.
 *
 * Erişim kuralları:
 *   - completeWorkout: sadece member rolü; kendi tamamlamasını yazar
 *   - getMyWorkoutHistory: sadece member rolü; kendi geçmişini okur
 *
 * Idempotency: @@unique([memberId, programDayId, scheduledDate]) — upsert
 * ile aynı kombinasyon tekrar gönderilirse mevcut kayıt döner, yeni oluşmaz.
 */
import type { PrismaClient } from '../db/prisma.js';

// ─── Input / Result types ─────────────────────────────────────────────────────

export interface CompleteWorkoutInput {
  programDayId: string;
  scheduledDate: Date;
  isLate?: boolean;
}

export interface WorkoutCompletionRow {
  id: string;
  memberId: string;
  programDayId: string;
  scheduledDate: Date;
  completedAt: Date;
  isLate: boolean;
  programDay: {
    dayOfWeek: number;
    title: string | null;
    programId: string;
  };
}

export type CompleteWorkoutResult =
  | { kind: 'ok'; completion: WorkoutCompletionRow }
  | { kind: 'forbidden' };

export interface WorkoutHistoryPage {
  items: WorkoutCompletionRow[];
  nextCursor: string | null;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function completeWorkout(
  prisma: PrismaClient,
  memberId: string,
  input: CompleteWorkoutInput,
): Promise<CompleteWorkoutResult> {
  const { programDayId, scheduledDate, isLate = false } = input;

  // programDayId'nin üyenin aktif programına ait olduğunu doğrula
  const programDay = await prisma.programDay.findFirst({
    where: { id: programDayId, program: { memberId, status: 'active' } },
    select: { id: true },
  });
  if (!programDay) return { kind: 'forbidden' };

  const row = await prisma.workoutCompletion.upsert({
    where: {
      memberId_programDayId_scheduledDate: { memberId, programDayId, scheduledDate },
    },
    create: {
      memberId,
      programDayId,
      scheduledDate,
      completedAt: new Date(),
      isLate,
    },
    update: {},
    select: {
      id: true,
      memberId: true,
      programDayId: true,
      scheduledDate: true,
      completedAt: true,
      isLate: true,
      programDay: {
        select: { dayOfWeek: true, title: true, programId: true },
      },
    },
  });

  return { kind: 'ok', completion: row };
}

export async function getMyWorkoutHistory(
  prisma: PrismaClient,
  memberId: string,
  cursor?: string,
  limit = 30,
): Promise<WorkoutHistoryPage> {
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const rows = await prisma.workoutCompletion.findMany({
    where: {
      memberId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { completedAt: 'desc' },
    take: safeLimit + 1,
    select: {
      id: true,
      memberId: true,
      programDayId: true,
      scheduledDate: true,
      completedAt: true,
      isLate: true,
      programDay: {
        select: { dayOfWeek: true, title: true, programId: true },
      },
    },
  });

  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
