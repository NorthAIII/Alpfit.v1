import { z } from 'zod';

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: z.string().nullable(),
  videoUrl: z.string().nullable(),
  isCustom: z.boolean(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  videoUrl: z.string().url().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const exerciseListSchema = z.array(exerciseSchema);
