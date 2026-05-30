// WorkoutHistoryScreen testi.
// useWorkoutHistory hook'u mock'lanır.
// jest.useFakeTimers ile tarih sabitlenir (MEMORY: "Snapshot testleri tarih-bağımsız olmalı").

import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import WorkoutHistoryScreen from './history';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../src/hooks/useWorkoutHistory', () => ({
  useWorkoutHistory: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const workoutHistoryHooks = jest.mocked(require('../../src/hooks/useWorkoutHistory'));

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeItem(overrides?: { id?: string; isLate?: boolean; title?: string | null }) {
  return {
    id: overrides?.id ?? 'cmp-1',
    memberId: 'm-1',
    programDayId: 'day-1',
    scheduledDate: '2026-05-29T00:00:00.000Z',
    completedAt: '2026-05-29T10:00:00.000Z',
    isLate: overrides?.isLate ?? false,
    programDay: {
      dayOfWeek: 3,
      // 'title' in overrides ile null'ı explicitly geçilmiş null ile varsayılan farkını ayırt et
      title: overrides && 'title' in overrides ? overrides.title ?? null : 'Üst Vücut',
      programId: 'prog-1',
    },
  };
}

const DEFAULT_HOOK_RESULT = {
  data: { pages: [{ items: [makeItem()], nextCursor: null }], pageParams: [undefined] },
  isLoading: false,
  isError: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  refetch: jest.fn(),
};

function setupHook(overrides?: Partial<typeof DEFAULT_HOOK_RESULT>) {
  workoutHistoryHooks.useWorkoutHistory.mockReturnValue({
    ...DEFAULT_HOOK_RESULT,
    ...overrides,
  });
}

describe('WorkoutHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-31T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('yüklenirken loading indicator gösterilir', () => {
    setupHook({ isLoading: true, data: undefined as never });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('history-loading')).toBeOnTheScreen();
  });

  it('hata durumunda hata mesajı ve Yenile butonu gösterilir', () => {
    setupHook({ isError: true, data: undefined as never });
    const { getByTestId, getByText } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('history-error')).toBeOnTheScreen();
    expect(getByText('Yenile')).toBeOnTheScreen();
  });

  it('Yenile butonuna basılınca refetch çağrılır', () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    setupHook({ isError: true, data: undefined as never, refetch });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    fireEvent.press(getByTestId('history-retry-button'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('boş geçmiş durumunda boş durum mesajı gösterilir', () => {
    setupHook({
      data: { pages: [{ items: [], nextCursor: null }], pageParams: [undefined] },
    });
    const { getByTestId, getByText } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('history-empty')).toBeOnTheScreen();
    expect(getByText('Henüz tamamlanmış antrenmanın yok.')).toBeOnTheScreen();
  });

  it('tamamlanmış antrenman listede gösterilir', () => {
    setupHook();
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('history-row-cmp-1')).toBeOnTheScreen();
  });

  it('isLate=false satırda ✓ ikonu görünür', () => {
    setupHook({
      data: {
        pages: [{ items: [makeItem({ isLate: false })], nextCursor: null }],
        pageParams: [undefined],
      },
    });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('status-icon-cmp-1').props['children']).toBe('✓');
  });

  it('isLate=true satırda ⏰ ikonu görünür', () => {
    setupHook({
      data: {
        pages: [{ items: [makeItem({ isLate: true })], nextCursor: null }],
        pageParams: [undefined],
      },
    });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getByTestId('status-icon-cmp-1').props['children']).toBe('⏰');
  });

  it('satıra tıklanınca WorkoutDetailScreen navigate edilir', () => {
    setupHook();
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    fireEvent.press(getByTestId('history-row-cmp-1'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    const url: string = mockPush.mock.calls[0][0] as string;
    expect(url).toContain('/workout-history/day-1');
    expect(url).toContain('programId=prog-1');
  });

  it('programDay.title null ise "Antrenman" metni gösterilir', () => {
    setupHook({
      data: {
        pages: [{ items: [makeItem({ title: null })], nextCursor: null }],
        pageParams: [undefined],
      },
    });
    const { getAllByText } = renderWithProviders(<WorkoutHistoryScreen />);
    expect(getAllByText('Antrenman').length).toBeGreaterThan(0);
  });

  it('son sayfaya gelinince fetchNextPage çağrılır', () => {
    const fetchNextPage = jest.fn();
    setupHook({ hasNextPage: true, isFetchingNextPage: false, fetchNextPage });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    const list = getByTestId('history-list');
    fireEvent(list, 'onEndReached');
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('fetchNextPage çalışırken tekrar çağrılmaz (isFetchingNextPage guard)', () => {
    const fetchNextPage = jest.fn();
    setupHook({ hasNextPage: true, isFetchingNextPage: true, fetchNextPage });
    const { getByTestId } = renderWithProviders(<WorkoutHistoryScreen />);
    const list = getByTestId('history-list');
    fireEvent(list, 'onEndReached');
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
