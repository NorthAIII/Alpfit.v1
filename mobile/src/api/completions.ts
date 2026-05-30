import { authedFetch } from './client';

export interface CompletionInput {
  programDayId: string;
  scheduledDate: string; // YYYY-MM-DD
  isLate?: boolean;
}

/** POST /workout-completions — idempotent. 409 zaten tamamlandı → sessizce başarı say. */
export async function completeWorkout(input: CompletionInput): Promise<void> {
  const res = await authedFetch('/workout-completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 409 || res.ok) return;
  throw new Error(`completeWorkout: ${res.status}`);
}
