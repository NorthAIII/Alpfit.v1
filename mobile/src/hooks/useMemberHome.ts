import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { fetchMyActiveProgram } from '../api/programs';
import { useMemberBannerStore } from '../stores/memberBannerStore';

import type { Program } from '../api/programs';

export type { Program };

/** JS getDay() (0=Paz…6=Cmt) → Alpfit dayOfWeek (0=Pzt…6=Paz). */
export function toAlpfitDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Cihaz yerel saatine göre bugünkü Alpfit dayOfWeek'i döner. */
export function todayAlpfitDay(): number {
  return toAlpfitDay(new Date().getDay());
}

/**
 * Programdan verilen Alpfit dayOfWeek'e ait ProgramDay'i bulur.
 * O gün yoksa null döner (= dinlenme günü).
 */
export function getTodayWorkout(program: Program, day?: number): Program['days'][number] | null {
  const target = day ?? todayAlpfitDay();
  return program.days.find((d) => d.dayOfWeek === target) ?? null;
}

/** GET /me/program — staleTime 1dk, gcTime 7gün (offline persist). 404 → null. */
export function useMyActiveProgram() {
  return useQuery({
    queryKey: ['my-program'],
    queryFn: fetchMyActiveProgram,
    staleTime: 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}

// ── Program Değişikliği Banner ────────────────────────────────────────────────

/**
 * AsyncStorage'da program id → dismiss zamanı (publishedAt string) tutulur.
 * Dismiss zamanı >= programın publishedAt'ı ise banner gösterilmez.
 * PT yeni publish ederse publishedAt ilerler → banner tekrar çıkar.
 */
const DISMISS_KEY = 'member-banner-dismiss-v1';

type DismissRecord = Record<string, string>;

async function loadDismissRecord(): Promise<DismissRecord> {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as DismissRecord) : {};
  } catch {
    return {};
  }
}

async function saveDismissRecord(record: DismissRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify(record));
  } catch {
    // ignore — dismiss kalıcılığı best-effort
  }
}

/**
 * Programın hasUnreadUpdate flag'ini izler; banner-store'u günceller.
 * Dismiss AsyncStorage'a persist edilir (app yeniden açılınca aynı versiyon
 * için banner çıkmaz; yeni publish sonrası tekrar çıkar).
 *
 * M4'te push bildirime yükseltilince trigger değişir, bu hook ve store aynı kalır.
 */
export function useProgramChangedBanner(program: Program | null | undefined) {
  const showBanner = useMemberBannerStore((s) => s.showBanner);
  const hideBanner = useMemberBannerStore((s) => s.hideBanner);
  const programChangedBanner = useMemberBannerStore((s) => s.programChangedBanner);

  useEffect(() => {
    if (!program?.hasUnreadUpdate || !program.id) {
      hideBanner();
      return;
    }

    const programId = program.id;
    const publishedAt = program.publishedAt ?? '';

    void loadDismissRecord().then((record) => {
      const dismissedAt = record[programId];
      // Zaten dismiss edilmiş VE aynı versiyon ise gösterme.
      if (dismissedAt && dismissedAt >= publishedAt) return;
      showBanner(programId);
    });
  }, [program?.id, program?.hasUnreadUpdate, program?.publishedAt, showBanner, hideBanner]);

  const handleDismiss = useCallback(async () => {
    if (!program?.id) return;
    const programId = program.id;
    const publishedAt = program.publishedAt ?? '';

    hideBanner();

    const record = await loadDismissRecord();
    await saveDismissRecord({ ...record, [programId]: publishedAt });
  }, [program?.id, program?.publishedAt, hideBanner]);

  return {
    /** Banner gösterilmeli mi? */
    isShowing: programChangedBanner !== null,
    /** Kullanıcı ✕'e bastı. */
    handleDismiss,
  };
}
