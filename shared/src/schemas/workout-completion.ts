import { z } from 'zod';

export const createWorkoutCompletionSchema = z.object({
  programDayId: z.string().min(1),
  // ISO 8601 datetime string — backend Date olarak saklar
  scheduledDate: z.string().datetime(),
  isLate: z.boolean().optional(),
});

export const workoutCompletionSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  programDayId: z.string(),
  scheduledDate: z.string().datetime(),
  completedAt: z.string().datetime(),
  isLate: z.boolean(),
});
