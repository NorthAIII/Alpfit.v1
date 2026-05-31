import { z } from 'zod';

export const patchNotificationPreferenceSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  comebackEnabled: z.boolean().optional(),
  systemEnabled: z.boolean().optional(),
  morningHour: z.number().int().min(0).max(23).optional(),
  morningMinute: z.number().int().min(0).max(59).optional(),
});
