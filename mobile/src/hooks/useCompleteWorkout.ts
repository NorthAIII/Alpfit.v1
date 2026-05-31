import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { completeWorkout } from '../api/completions';

import type { CompletionInput } from '../api/completions';

export type { CompletionInput };

/** AsyncStorage key — bildirim izni diyaloğu daha önce gösterildi mi? */
const PERMISSION_ASKED_KEY = 'notification:permission_asked';

/**
 * "Antrenmanı bitir" mutation'ı.
 *
 * networkMode: 'online' → NetInfo kurulu olduğunda offline iken mutation
 * pause edilir, internet gelince otomatik devam eder. NetInfo yoksa TanStack
 * Query'nin navigator.onLine tespitine güvenir.
 *
 * 409 (zaten tamamlandı) → completeWorkout fonksiyonu sessizce başarı sayar
 * (idempotent). onSuccess her iki senaryoda da çağrılır.
 *
 * İlk başarılı antrenman tamamlama sonrasında bildirim izni diyaloğu bir kez
 * gösterilir. `showPermissionModal: true` → çağıran ekran `NotificationPermissionModal`
 * render eder. `onPermissionHandled()` → modal kapandığını bildirir ve flag'i set eder.
 */
export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: CompletionInput) => completeWorkout(input),
    networkMode: 'online',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workout-completions'] });
      void queryClient.invalidateQueries({ queryKey: ['my-program'] });
      // İlk antrenman tamamlanınca bildirim izni diyaloğunu göster.
      void AsyncStorage.getItem(PERMISSION_ASKED_KEY).then((value) => {
        if (value === null) {
          setShowPermissionModal(true);
        }
      });
    },
  });

  const onPermissionHandled = useCallback(() => {
    setShowPermissionModal(false);
    void AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
  }, []);

  return { ...mutation, showPermissionModal, onPermissionHandled };
}
