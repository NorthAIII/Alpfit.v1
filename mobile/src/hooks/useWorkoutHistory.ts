import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchMyWorkoutHistory } from '../api/completions';

import type { WorkoutHistoryPage } from '../api/completions';

export type { WorkoutCompletionItem, WorkoutHistoryPage } from '../api/completions';

/**
 * Üyenin tamamlanmış antrenman geçmişi — cursor-based infinite scroll.
 *
 * Her sayfa 30 kayıt. nextCursor null ise son sayfaya ulaşıldı.
 * Cache: gcTime 7 gün (offline persist altyapısından yararlanır).
 */
export function useWorkoutHistory() {
  return useInfiniteQuery({
    queryKey: ['workout-completions'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchMyWorkoutHistory(pageParam, 30),
    getNextPageParam: (lastPage: WorkoutHistoryPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}
