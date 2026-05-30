// Auto-save hook for ProgramBuilderScreen (TASK-2.09).
// programDays değiştiğinde 1sn debounce → PATCH /programs/:id.
// cancelPendingAutoSave() publish butonuna basıldığında timer'ı iptal eder.

import { useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { patchProgram } from '../api/programs';

import type { PatchDay } from '../api/programs';
import type { ProgramDayExercise } from '../components/ExerciseDayCard';

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function buildPatchPayload(
  programDays: Record<DayOfWeek, ProgramDayExercise[]>,
): PatchDay[] {
  const result: PatchDay[] = [];
  for (let day = 0; day <= 6; day++) {
    const exercises = programDays[day as DayOfWeek];
    if (!exercises || exercises.length === 0) continue;
    result.push({
      dayOfWeek: day,
      position: day,
      exercises: exercises.map((ex, i) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        position: i,
        ...(ex.restSeconds !== undefined ? { restSeconds: ex.restSeconds } : {}),
        ...(ex.notes !== undefined && ex.notes !== '' ? { notes: ex.notes } : {}),
      })),
    });
  }
  return result;
}

export interface UseProgramAutoSaveReturn {
  saveState: SaveState;
  cancelPendingAutoSave: () => void;
}

export function useProgramAutoSave(
  programId: string,
  programDays: Record<DayOfWeek, ProgramDayExercise[]>,
): UseProgramAutoSaveReturn {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  const { mutate } = useMutation({
    mutationFn: (days: PatchDay[]) => patchProgram(programId, days),
    onMutate: () => setSaveState('saving'),
    onSuccess: () => {
      setSaveState('saved');
      // 3sn sonra idle'a dön (başka bir kaydetme başlamadıysa)
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 3000);
    },
    onError: () => setSaveState('error'),
  });

  function cancelPendingAutoSave() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    // İlk render'da auto-save tetiklenmez (mount'ta programDays boş olabilir)
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    cancelPendingAutoSave();
    const days = buildPatchPayload(programDays);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      mutate(days);
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  // programDays referansı her setProgramDays çağrısında değişir (yeni obje) → doğru davranış.
  // mutate TanStack Query'nin stable ref'i — ESLint dep uyarısı false-positive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programDays]);

  return { saveState, cancelPendingAutoSave };
}
