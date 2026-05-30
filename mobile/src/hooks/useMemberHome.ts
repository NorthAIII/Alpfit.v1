import { useQuery } from '@tanstack/react-query';

import { fetchMyActiveProgram } from '../api/programs';
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
