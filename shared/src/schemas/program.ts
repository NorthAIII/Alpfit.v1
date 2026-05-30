import { z } from 'zod';

const programStatusSchema = z.enum(['draft', 'active', 'archived']);

const programDayExerciseInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: z.string().nullable(),
  videoUrl: z.string().nullable(),
  isCustom: z.boolean(),
});

export const programDayExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  restSeconds: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  position: z.number().int().nonnegative(),
  exercise: programDayExerciseInfoSchema,
});

export const programDaySchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  title: z.string().nullable(),
  position: z.number().int().nonnegative(),
  isOneOff: z.boolean(),
  specificDate: z.string().datetime().nullable(),
  exercises: z.array(programDayExerciseSchema),
});

export const programSchema = z.object({
  id: z.string(),
  trainerId: z.string(),
  memberId: z.string(),
  status: programStatusSchema,
  days: z.array(programDaySchema),
  publishedAt: z.string().datetime().nullable(),
  archivedAt: z.string().datetime().nullable(),
  // Yalnızca GET /me/program (üye görünümü) döner — PT endpoint'inde undefined.
  hasUnreadUpdate: z.boolean().optional(),
});

export const createProgramSchema = z.object({
  memberId: z.string().min(1),
});

const patchDayExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  position: z.number().int().nonnegative(),
});

const patchDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  title: z.string().optional(),
  position: z.number().int().nonnegative(),
  isOneOff: z.boolean().optional(),
  specificDate: z.string().datetime().optional(),
  exercises: z.array(patchDayExerciseSchema),
});

export const patchProgramSchema = z.object({
  days: z.array(patchDaySchema),
});
