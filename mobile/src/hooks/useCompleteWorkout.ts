import { useMutation, useQueryClient } from '@tanstack/react-query';

import { completeWorkout } from '../api/completions';
import type { CompletionInput } from '../api/completions';

export type { CompletionInput };

/**
 * "Antrenmanı bitir" mutation'ı.
 *
 * networkMode: 'online' → NetInfo kurulu olduğunda offline iken mutation
 * pause edilir, internet gelince otomatik devam eder. NetInfo yoksa TanStack
 * Query'nin navigator.onLine tespitine güvenir.
 *
 * 409 (zaten tamamlandı) → completeWorkout fonksiyonu sessizce başarı sayar
 * (idempotent). onSuccess her iki senaryoda da çağrılır.
 */
export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompletionInput) => completeWorkout(input),
    networkMode: 'online',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workout-completions'] });
      void queryClient.invalidateQueries({ queryKey: ['my-program'] });
    },
  });
}
