// Bildirim tercihleri veri hook'u (TASK-3.12).
// Mount'ta backend'den tercihleri yükler. update() optimistic güncelleme yapar —
// API hata verirse önceki state'e döner (rollback).

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getNotificationPreferences,
  patchNotificationPreferences,
  type NotificationPreferences,
} from '../api/notification-preferences';

export interface UseNotificationPreferencesResult {
  data: NotificationPreferences | null;
  isLoading: boolean;
  error: Error | null;
  update: (patch: Partial<NotificationPreferences>) => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const [data, setData] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stale-closure olmadan update'te her zaman güncel data'ya erişmek için ref.
  const dataRef = useRef<NotificationPreferences | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getNotificationPreferences()
      .then((prefs) => {
        if (active) {
          setData(prefs);
          dataRef.current = prefs;
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<NotificationPreferences>): Promise<void> => {
    const previous = dataRef.current;
    if (previous === null) {
      return;
    }
    // Optimistic: local state hemen güncelle, ağ gecikmesi görünmez.
    const optimistic = { ...previous, ...patch };
    setData(optimistic);
    dataRef.current = optimistic;
    try {
      const confirmed = await patchNotificationPreferences(patch);
      setData(confirmed);
      dataRef.current = confirmed;
    } catch (e) {
      // Rollback: API hata verdi, önceki değerlere dön.
      setData(previous);
      dataRef.current = previous;
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  return { data, isLoading, error, update };
}
