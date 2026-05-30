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

// ─── Geçmiş listesi ────────────────────────────────────────────────────────────

export interface WorkoutCompletionItem {
  id: string;
  memberId: string;
  programDayId: string;
  scheduledDate: string; // ISO 8601 (JSON'dan string gelir)
  completedAt: string;   // ISO 8601
  isLate: boolean;
  programDay: {
    dayOfWeek: number;
    title: string | null;
    programId: string;
  };
}

export interface WorkoutHistoryPage {
  items: WorkoutCompletionItem[];
  nextCursor: string | null;
}

/** GET /me/workout-completions — cursor-based (30/sayfa). cursor yoksa ilk sayfa. */
export async function fetchMyWorkoutHistory(
  cursor?: string,
  limit = 30,
): Promise<WorkoutHistoryPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await authedFetch(`/me/workout-completions?${params.toString()}`);
  if (!res.ok) throw new Error(`fetchMyWorkoutHistory: ${res.status}`);
  return res.json() as Promise<WorkoutHistoryPage>;
}
