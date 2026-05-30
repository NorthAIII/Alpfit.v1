// WorkoutDetailScreen testi.
// useQuery (program fetch) + expo-router mock'lanır.

import { renderWithProviders } from '../../test/render-with-providers';

import WorkoutDetailScreen from './[programDayId]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({
    programDayId: 'day-1',
    programId: 'prog-1',
    completedAt: '2026-05-29T10:00:00.000Z',
    isLate: 'false',
    title: 'U%CC%88st%20Vu%CC%88cut',
  }),
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('@tanstack/react-query', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('@tanstack/react-query') as object;
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const reactQuery = jest.mocked(require('@tanstack/react-query'));

const EXERCISE = {
  id: 'pde-1',
  position: 0,
  sets: 3,
  reps: '10',
  restSeconds: 60,
  notes: null,
  exercise: { id: 'ex-1', name: 'Bench Press', videoUrl: null },
};

const PROGRAM = {
  id: 'prog-1',
  trainerId: 't-1',
  memberId: 'm-1',
  status: 'active',
  publishedAt: '2026-05-28T00:00:00.000Z',
  archivedAt: null,
  days: [
    {
      id: 'day-1',
      dayOfWeek: 3,
      title: 'Üst Vücut',
      position: 0,
      isOneOff: false,
      specificDate: null,
      exercises: [EXERCISE],
    },
  ],
};

function setupQuery(overrides?: { isLoading?: boolean; isError?: boolean; data?: typeof PROGRAM | null }) {
  reactQuery.useQuery.mockReturnValue({
    data: overrides?.data ?? PROGRAM,
    isLoading: overrides?.isLoading ?? false,
    isError: overrides?.isError ?? false,
  });
}

describe('WorkoutDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-31T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('yüklenirken loading indicator gösterilir', () => {
    setupQuery({ isLoading: true, data: null });
    const { getByTestId } = renderWithProviders(<WorkoutDetailScreen />);
    expect(getByTestId('detail-loading')).toBeOnTheScreen();
  });

  it('hata durumunda hata mesajı gösterilir', () => {
    setupQuery({ isError: true, data: null });
    const { getByTestId } = renderWithProviders(<WorkoutDetailScreen />);
    expect(getByTestId('detail-error')).toBeOnTheScreen();
  });

  it('egzersizler okuma modunda listede gösterilir', () => {
    setupQuery();
    const { getByTestId, getByText } = renderWithProviders(<WorkoutDetailScreen />);
    expect(getByTestId('detail-exercise-list')).toBeOnTheScreen();
    expect(getByText('Bench Press')).toBeOnTheScreen();
    expect(getByTestId('detail-ex-pde-1')).toBeOnTheScreen();
  });

  it('header antrenman adı + tarih içerir', () => {
    setupQuery();
    const { getByTestId } = renderWithProviders(<WorkoutDetailScreen />);
    const title = getByTestId('detail-title');
    expect(title.props['children'].join('')).toContain('29 Mayıs 2026');
  });

  it('isLate=false ise "Tamamlandı" badge gösterilir', () => {
    setupQuery();
    const { getByText } = renderWithProviders(<WorkoutDetailScreen />);
    expect(getByText('Tamamlandı')).toBeOnTheScreen();
  });

  it('Geri butonuna basılınca router.back çağrılır', () => {
    setupQuery();
    const { getByTestId } = renderWithProviders(<WorkoutDetailScreen />);
    const { fireEvent } = jest.requireActual('@testing-library/react-native') as typeof import('@testing-library/react-native');
    fireEvent.press(getByTestId('detail-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
