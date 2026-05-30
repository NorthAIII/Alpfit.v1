// PT in-app event polling hook (TASK-1.32). PT "Üyeler" sekmesi açıkken (focus)
// `GET /trainers/me/events`'i 20sn aralıkla poll eder; üye davet kabul ettiğinde
// gelen event'leri banner kuyruğuna ekler + `onNewEvents` callback'ini tetikler
// (ekran listeyi tazeler + yeni üyeyi highlight'lar).
//
// Sınır kararları (task Dikkat Noktaları):
//  - **Foreground-only:** `useFocusEffect` ile sekme odaktayken aktif, blur'da
//    durur. iOS background fetch kotası + pil maliyeti nedeniyle arka plan
//    polling YOK (gerçek push M4'te APNs/FCM ile gelir).
//  - **Backoff:** ağ hatasında 1s→5s→30s exponential backoff, sonra düz 30s;
//    başarılı poll sayacı sıfırlar.
//  - **Baseline:** `since` hook focus anına set edilir — yalnızca o andan SONRAKİ
//    kabuller banner olur (eski üyeler yeniden banner üretmez).

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { listPtEvents, type PtEvent } from '../api/trainers';

import { useBannerStore } from './banner-store';

export const POLL_INTERVAL_MS = 20_000;
const BACKOFF_MS = [1_000, 5_000, 30_000] as const;

interface UsePtEventsOptions {
  accessToken: string | undefined;
  /** Yeni event(ler) geldiğinde çağrılır (liste tazeleme + highlight için). */
  onNewEvents?: (events: PtEvent[]) => void;
}

export function usePtEvents({ accessToken, onNewEvents }: UsePtEventsOptions): void {
  const enqueue = useBannerStore((s) => s.enqueue);
  // En güncel callback'i ref'te tut → interval'ı yeniden kurmadan değişebilir.
  const onNewRef = useRef(onNewEvents);
  onNewRef.current = onNewEvents;

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        return;
      }
      let active = true;
      let timer: ReturnType<typeof setTimeout> | undefined;
      // baseline: yalnızca focus'tan SONRAKİ kabuller banner olur.
      let since = new Date().toISOString();
      let failures = 0;

      const schedule = (delay: number) => {
        timer = setTimeout(() => void poll(), delay);
      };

      const poll = async () => {
        if (!active) {
          return;
        }
        const res = await listPtEvents(accessToken, since);
        if (!active) {
          return;
        }
        if (res.kind === 'ok') {
          failures = 0;
          if (res.events.length > 0) {
            // Cursor = en yeni occurredAt (liste newest-first ama yine de max al).
            since = res.events.reduce((max, e) => (e.occurredAt > max ? e.occurredAt : max), since);
            enqueue(res.events);
            onNewRef.current?.(res.events);
          }
          schedule(POLL_INTERVAL_MS);
        } else if (res.kind === 'network') {
          const delay = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)] ?? 30_000;
          failures += 1;
          schedule(delay);
        } else {
          // unauthorized: oturum geçersiz → poll dur (auth-gate TASK-1.33 ele alır).
          active = false;
        }
      };

      schedule(POLL_INTERVAL_MS);

      return () => {
        active = false;
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [accessToken, enqueue]),
  );
}
