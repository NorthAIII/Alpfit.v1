// useProgramAutoSave hook testi.
// patchProgram mock'lanır — gerçek ağ çağrısı yapılmaz.
// jest.useFakeTimers ile debounce zamanlaması test edilir.

import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

import { useProgramAutoSave, buildPatchPayload } from './useProgramAutoSave';

import type { ProgramDayExercise } from '../components/ExerciseDayCard';

// patchProgram mock'la — ağ çağrısı istemiyoruz
jest.mock('../api/programs', () => ({
  patchProgram: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchProgram } = jest.mocked(require('../api/programs'));

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function emptyDays(): Record<DayOfWeek, ProgramDayExercise[]> {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

function daysWithExercise(): Record<DayOfWeek, ProgramDayExercise[]> {
  return {
    ...emptyDays(),
    0: [{ exerciseId: 'ex-1', name: 'Squat', muscleGroup: 'Bacak', sets: 3, reps: '10' }],
  };
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('buildPatchPayload', () => {
  it('boş günleri atlar', () => {
    const result = buildPatchPayload(emptyDays());
    expect(result).toHaveLength(0);
  });

  it('egzersiz olan günü ekler, position index ile eşleşir', () => {
    const days = daysWithExercise();
    const result = buildPatchPayload(days);
    expect(result).toHaveLength(1);
    expect(result[0]?.dayOfWeek).toBe(0);
    expect(result[0]?.exercises[0]?.exerciseId).toBe('ex-1');
    expect(result[0]?.exercises[0]?.position).toBe(0);
  });

  it('restSeconds ve notes undefined ise patch objesine eklenmez', () => {
    const days: Record<DayOfWeek, ProgramDayExercise[]> = {
      ...emptyDays(),
      0: [{ exerciseId: 'ex-1', name: 'Bench', muscleGroup: null, sets: 3, reps: '8' }],
    };
    const result = buildPatchPayload(days);
    expect('restSeconds' in (result[0]?.exercises[0] ?? {})).toBe(false);
    expect('notes' in (result[0]?.exercises[0] ?? {})).toBe(false);
  });

  it('restSeconds tanımlıysa patch objesine dahil edilir', () => {
    const days: Record<DayOfWeek, ProgramDayExercise[]> = {
      ...emptyDays(),
      0: [{ exerciseId: 'ex-2', name: 'DL', muscleGroup: null, sets: 4, reps: '5', restSeconds: 90 }],
    };
    const result = buildPatchPayload(days);
    expect(result[0]?.exercises[0]?.restSeconds).toBe(90);
  });
});

describe('useProgramAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (patchProgram as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mount anında PATCH çağrılmaz', () => {
    const { unmount } = renderHook(
      () => useProgramAutoSave('prog-1', emptyDays()),
      { wrapper: createWrapper() },
    );
    act(() => { jest.runAllTimers(); });
    expect(patchProgram).not.toHaveBeenCalled();
    unmount();
  });

  it('programDays değiştiğinde 1sn sonra PATCH çağrılır', async () => {
    const initial = emptyDays();
    const updated = daysWithExercise();

    const { rerender } = renderHook(
      ({ days }: { days: typeof initial }) => useProgramAutoSave('prog-1', days),
      { wrapper: createWrapper(), initialProps: { days: initial } },
    );

    // programDays değişir
    rerender({ days: updated });

    // 1sn geçmeden PATCH tetiklenmez
    act(() => { jest.advanceTimersByTime(500); });
    expect(patchProgram).not.toHaveBeenCalled();

    // 1sn geçince PATCH çağrılır
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(patchProgram).toHaveBeenCalledWith('prog-1', expect.any(Array));
  });

  it('saveState: idle → saving → saved (başarılı PATCH)', async () => {
    const initial = emptyDays();
    const updated = daysWithExercise();

    const { result, rerender } = renderHook(
      ({ days }: { days: typeof initial }) => useProgramAutoSave('prog-1', days),
      { wrapper: createWrapper(), initialProps: { days: initial } },
    );

    expect(result.current.saveState).toBe('idle');

    rerender({ days: updated });

    await act(async () => { jest.advanceTimersByTime(1000); });

    // mutate çağrıldı → onMutate → saving
    // mock resolved → onSuccess → saved
    expect(['saving', 'saved']).toContain(result.current.saveState);
  });

  it('PATCH başarısız olunca saveState = error', async () => {
    (patchProgram as jest.Mock).mockRejectedValue(new Error('network'));

    const initial = emptyDays();
    const updated = daysWithExercise();

    const { result, rerender } = renderHook(
      ({ days }: { days: typeof initial }) => useProgramAutoSave('prog-1', days),
      { wrapper: createWrapper(), initialProps: { days: initial } },
    );

    rerender({ days: updated });
    await act(async () => { jest.advanceTimersByTime(1000); });

    expect(result.current.saveState).toBe('error');
  });

  it('cancelPendingAutoSave çağrılınca timer iptal olur, PATCH tetiklenmez', async () => {
    const initial = emptyDays();
    const updated = daysWithExercise();

    const { result, rerender } = renderHook(
      ({ days }: { days: typeof initial }) => useProgramAutoSave('prog-1', days),
      { wrapper: createWrapper(), initialProps: { days: initial } },
    );

    rerender({ days: updated });

    // Timer başladı ama henüz tetiklenmedi
    act(() => { jest.advanceTimersByTime(400); });

    // Publish simülasyonu: timer iptal et
    act(() => { result.current.cancelPendingAutoSave(); });

    // 1sn daha geçse bile PATCH çağrılmaz
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(patchProgram).not.toHaveBeenCalled();
  });
});
