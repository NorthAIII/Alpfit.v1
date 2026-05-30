/**
 * Exercise service (TASK-2.02).
 *
 * Egzersiz listeleme + PT custom CRUD. Tüm operasyonlar Prisma client'ı
 * parametre olarak alır — test'lerde izole client enjekte edilir.
 *
 * Erişim kuralları:
 *   - Liste: çekirdek (isCustom=false, deletedAt=null) + trainer'ın custom'ları
 *   - Oluşturma: trainer'a özgü (isCustom=true, createdById=trainerId)
 *   - Güncelleme/Silme: sadece kendi custom'ı; çekirdek → 403; başkasının → 403
 */
import type { PrismaClient } from '../db/prisma.js';

interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  isCustom: boolean;
}

const SELECT = {
  id: true,
  name: true,
  muscleGroup: true,
  videoUrl: true,
  isCustom: true,
} as const;

export async function listExercises(
  prisma: PrismaClient,
  trainerId: string,
  search?: string,
  muscleGroup?: string,
): Promise<ExerciseRow[]> {
  return prisma.exercise.findMany({
    where: {
      deletedAt: null,
      OR: [{ isCustom: false }, { isCustom: true, createdById: trainerId }],
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(muscleGroup ? { muscleGroup: { equals: muscleGroup, mode: 'insensitive' } } : {}),
    },
    select: SELECT,
    orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
  });
}

export async function createExercise(
  prisma: PrismaClient,
  trainerId: string,
  data: { name: string; muscleGroup?: string; videoUrl?: string },
): Promise<ExerciseRow> {
  return prisma.exercise.create({
    data: {
      name: data.name,
      muscleGroup: data.muscleGroup ?? null,
      videoUrl: data.videoUrl ?? null,
      isCustom: true,
      createdById: trainerId,
    },
    select: SELECT,
  });
}

export type UpdateExerciseResult =
  | { kind: 'ok'; exercise: ExerciseRow }
  | { kind: 'not_found' }
  | { kind: 'core_forbidden' }
  | { kind: 'forbidden' };

export async function updateExercise(
  prisma: PrismaClient,
  trainerId: string,
  exerciseId: string,
  data: { name?: string; muscleGroup?: string; videoUrl?: string },
): Promise<UpdateExerciseResult> {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, deletedAt: null },
  });
  if (!exercise) return { kind: 'not_found' };
  if (!exercise.isCustom) return { kind: 'core_forbidden' };
  if (exercise.createdById !== trainerId) return { kind: 'forbidden' };

  const updated = await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.muscleGroup !== undefined ? { muscleGroup: data.muscleGroup } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
    },
    select: SELECT,
  });
  return { kind: 'ok', exercise: updated };
}

export type DeleteExerciseResult =
  | { kind: 'ok' }
  | { kind: 'not_found' }
  | { kind: 'core_forbidden' }
  | { kind: 'forbidden' };

export async function deleteExercise(
  prisma: PrismaClient,
  trainerId: string,
  exerciseId: string,
): Promise<DeleteExerciseResult> {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, deletedAt: null },
  });
  if (!exercise) return { kind: 'not_found' };
  if (!exercise.isCustom) return { kind: 'core_forbidden' };
  if (exercise.createdById !== trainerId) return { kind: 'forbidden' };

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { deletedAt: new Date() },
  });
  return { kind: 'ok' };
}
