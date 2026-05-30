/**
 * Program service (TASK-2.03).
 *
 * Program CRUD + yayınlama + kopyalama. Tüm operasyonlar Prisma client'ı
 * parametre olarak alır — test'lerde izole client enjekte edilir.
 *
 * Erişim kuralları:
 *   - Oluşturma: trainer sadece aktif (endedAt=null) üyesine program yazabilir
 *   - PATCH (auto-save): trainer + ownership + status=draft
 *   - Publish: trainer + ownership
 *   - Copy: trainer kendi programını kopyalar, hedef üye kendi üyesi olmalı
 *   - GET /programs/:id: trainer kendi programı | member kendi programı
 *   - GET /members/:memberId/program: trainer + aktif üye ilişkisi
 *   - GET /me/program: member kendi aktif programı + hasUnreadUpdate flag
 */
import type { PrismaClient } from '../db/prisma.js';
import type { patchProgramSchema } from '@alpfit/shared';
import type { z } from 'zod';

type PatchBody = z.infer<typeof patchProgramSchema>;

// ─── Result types ─────────────────────────────────────────────────────────────

export type CreateProgramResult =
  | { kind: 'ok'; program: { id: string; trainerId: string; memberId: string; status: string } }
  | { kind: 'no_relation' };

export type PatchProgramResult =
  | { kind: 'ok'; program: FullProgram }
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'not_draft' };

export type PublishProgramResult =
  | { kind: 'ok'; program: FullProgram }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

export type CopyProgramResult =
  | { kind: 'ok'; program: { id: string; trainerId: string; memberId: string; status: string } }
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'no_relation' };

export type GetProgramResult =
  | { kind: 'ok'; program: FullProgram }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

export type GetMemberActiveProgramResult =
  | { kind: 'ok'; program: FullProgram }
  | { kind: 'not_found' }
  | { kind: 'no_relation' };

export type GetMyActiveProgramResult =
  | { kind: 'ok'; program: FullProgram & { hasUnreadUpdate: boolean } }
  | { kind: 'not_found' };

// ─── Response shape ───────────────────────────────────────────────────────────

interface ExerciseInfo {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  isCustom: boolean;
}

interface DayExerciseRow {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  position: number;
  exercise: ExerciseInfo;
}

interface ProgramDayRow {
  id: string;
  dayOfWeek: number;
  title: string | null;
  position: number;
  isOneOff: boolean;
  specificDate: Date | null;
  exercises: DayExerciseRow[];
}

export interface FullProgram {
  id: string;
  trainerId: string;
  memberId: string;
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  days: ProgramDayRow[];
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function fetchFullProgram(
  prisma: PrismaClient,
  programId: string,
): Promise<FullProgram | null> {
  const row = await prisma.program.findUnique({
    where: { id: programId },
    select: {
      id: true,
      trainerId: true,
      memberId: true,
      status: true,
      publishedAt: true,
      archivedAt: true,
      days: {
        select: {
          id: true,
          dayOfWeek: true,
          title: true,
          position: true,
          isOneOff: true,
          specificDate: true,
          exercises: {
            select: {
              id: true,
              exerciseId: true,
              sets: true,
              reps: true,
              restSeconds: true,
              notes: true,
              position: true,
              exercise: {
                select: { id: true, name: true, muscleGroup: true, videoUrl: true, isCustom: true },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
  return row as FullProgram | null;
}

async function hasTrainerMemberRelation(
  prisma: PrismaClient,
  trainerId: string,
  memberId: string,
): Promise<boolean> {
  const rel = await prisma.trainerMember.findFirst({
    where: { trainerId, memberId, endedAt: null },
    select: { id: true },
  });
  return rel !== null;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function createProgram(
  prisma: PrismaClient,
  trainerId: string,
  memberId: string,
): Promise<CreateProgramResult> {
  const hasRelation = await hasTrainerMemberRelation(prisma, trainerId, memberId);
  if (!hasRelation) return { kind: 'no_relation' };

  const program = await prisma.program.create({
    data: { trainerId, memberId, status: 'draft' },
    select: { id: true, trainerId: true, memberId: true, status: true },
  });
  return { kind: 'ok', program: { ...program, status: program.status as string } };
}

export async function patchProgram(
  prisma: PrismaClient,
  trainerId: string,
  programId: string,
  body: PatchBody,
): Promise<PatchProgramResult> {
  const existing = await prisma.program.findFirst({
    where: { id: programId },
    select: { trainerId: true, status: true },
  });
  if (!existing) return { kind: 'not_found' };
  if (existing.trainerId !== trainerId) return { kind: 'forbidden' };
  if (existing.status !== 'draft') return { kind: 'not_draft' };

  await prisma.$transaction(async (tx) => {
    // Önce mevcut günleri bul — ProgramDayExercise'leri silmek için gerekli
    const existingDays = await tx.programDay.findMany({
      where: { programId },
      select: { id: true },
    });
    const dayIds = existingDays.map((d) => d.id);

    // Egzersizleri önce sil (FK: programDayId → ProgramDay)
    if (dayIds.length > 0) {
      await tx.programDayExercise.deleteMany({ where: { programDayId: { in: dayIds } } });
    }

    // Günleri sil
    await tx.programDay.deleteMany({ where: { programId } });

    // Yeni günleri ve egzersizlerini oluştur
    for (const day of body.days) {
      await tx.programDay.create({
        data: {
          programId,
          dayOfWeek: day.dayOfWeek,
          title: day.title ?? null,
          position: day.position,
          isOneOff: day.isOneOff ?? false,
          specificDate: day.specificDate ? new Date(day.specificDate) : null,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds ?? null,
              notes: ex.notes ?? null,
              position: ex.position,
            })),
          },
        },
      });
    }
  });

  const updated = await fetchFullProgram(prisma, programId);
  if (!updated) return { kind: 'not_found' };
  return { kind: 'ok', program: updated };
}

export async function publishProgram(
  prisma: PrismaClient,
  trainerId: string,
  programId: string,
): Promise<PublishProgramResult> {
  const existing = await prisma.program.findFirst({
    where: { id: programId },
    select: { trainerId: true, memberId: true },
  });
  if (!existing) return { kind: 'not_found' };
  if (existing.trainerId !== trainerId) return { kind: 'forbidden' };

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Üyenin mevcut aktif programlarını arşivle (bu program hariç)
    await tx.program.updateMany({
      where: { memberId: existing.memberId, status: 'active', NOT: { id: programId } },
      data: { status: 'archived', archivedAt: now },
    });

    // Bu programı yayınla
    await tx.program.update({
      where: { id: programId },
      data: { status: 'active', publishedAt: now },
    });
  });

  const published = await fetchFullProgram(prisma, programId);
  if (!published) return { kind: 'not_found' };
  return { kind: 'ok', program: published };
}

export async function copyProgram(
  prisma: PrismaClient,
  trainerId: string,
  sourceProgramId: string,
  targetMemberId: string,
): Promise<CopyProgramResult> {
  // Kaynak programı doğrula
  const source = await fetchFullProgram(prisma, sourceProgramId);
  if (!source) return { kind: 'not_found' };
  if (source.trainerId !== trainerId) return { kind: 'forbidden' };

  // Hedef üye ile trainer ilişkisini doğrula
  const hasRelation = await hasTrainerMemberRelation(prisma, trainerId, targetMemberId);
  if (!hasRelation) return { kind: 'no_relation' };

  // Yeni program oluştur (draft)
  const newProgram = await prisma.program.create({
    data: {
      trainerId,
      memberId: targetMemberId,
      status: 'draft',
      days: {
        create: source.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          title: day.title,
          position: day.position,
          isOneOff: day.isOneOff,
          specificDate: day.specificDate,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              notes: ex.notes,
              position: ex.position,
            })),
          },
        })),
      },
    },
    select: { id: true, trainerId: true, memberId: true, status: true },
  });

  return { kind: 'ok', program: { ...newProgram, status: newProgram.status as string } };
}

export async function getProgram(
  prisma: PrismaClient,
  requesterId: string,
  programId: string,
  role: 'trainer' | 'member',
): Promise<GetProgramResult> {
  const program = await fetchFullProgram(prisma, programId);
  if (!program) return { kind: 'not_found' };

  if (role === 'trainer' && program.trainerId !== requesterId) return { kind: 'forbidden' };
  if (role === 'member' && program.memberId !== requesterId) return { kind: 'forbidden' };

  return { kind: 'ok', program };
}

export async function getMemberActiveProgram(
  prisma: PrismaClient,
  trainerId: string,
  memberId: string,
): Promise<GetMemberActiveProgramResult> {
  const hasRelation = await hasTrainerMemberRelation(prisma, trainerId, memberId);
  if (!hasRelation) return { kind: 'no_relation' };

  const row = await prisma.program.findFirst({
    where: { memberId, trainerId, status: 'active' },
    select: {
      id: true,
      trainerId: true,
      memberId: true,
      status: true,
      publishedAt: true,
      archivedAt: true,
      days: {
        select: {
          id: true,
          dayOfWeek: true,
          title: true,
          position: true,
          isOneOff: true,
          specificDate: true,
          exercises: {
            select: {
              id: true,
              exerciseId: true,
              sets: true,
              reps: true,
              restSeconds: true,
              notes: true,
              position: true,
              exercise: {
                select: { id: true, name: true, muscleGroup: true, videoUrl: true, isCustom: true },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!row) return { kind: 'not_found' };
  return { kind: 'ok', program: row as FullProgram };
}

export async function getMyActiveProgram(
  prisma: PrismaClient,
  memberId: string,
): Promise<GetMyActiveProgramResult> {
  const program = await prisma.program.findFirst({
    where: { memberId, status: 'active' },
    select: {
      id: true,
      trainerId: true,
      memberId: true,
      status: true,
      publishedAt: true,
      archivedAt: true,
      days: {
        select: {
          id: true,
          dayOfWeek: true,
          title: true,
          position: true,
          isOneOff: true,
          specificDate: true,
          exercises: {
            select: {
              id: true,
              exerciseId: true,
              sets: true,
              reps: true,
              restSeconds: true,
              notes: true,
              position: true,
              exercise: {
                select: { id: true, name: true, muscleGroup: true, videoUrl: true, isCustom: true },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!program) return { kind: 'not_found' };

  // Son antrenman tamamlamasını bul — hasUnreadUpdate hesabı için
  const lastCompletion = await prisma.workoutCompletion.findFirst({
    where: { memberId },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  const publishedAt = program.publishedAt as Date | null;
  const hasUnreadUpdate = lastCompletion
    ? publishedAt !== null && publishedAt > lastCompletion.completedAt
    : true;

  return { kind: 'ok', program: { ...(program as FullProgram), hasUnreadUpdate } };
}
