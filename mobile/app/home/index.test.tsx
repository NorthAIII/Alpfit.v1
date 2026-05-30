// MemberHomeScreen component testi.
// expo-router ve useMemberHome hook'u mock'lanır.
// jest.useFakeTimers ile bugünün günü sabitlenir (MEMORY: "Snapshot testleri tarih-bağımsız olmalı").
// 2026-06-01 = Pazartesi → JS getDay()=1 → Alpfit day=(1+6)%7=0 → today=0 (Pzt)

import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import MemberHomeScreen from './index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../src/hooks/useMemberHome', () => ({
  useMyActiveProgram: jest.fn(),
  getTodayWorkout: jest.fn(),
  todayAlpfitDay: jest.fn().mockReturnValue(0), // Pazartesi (Alpfit 0)
  useProgramChangedBanner: jest
    .fn()
    .mockReturnValue({ isShowing: false, handleDismiss: jest.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const memberHomeHooks = jest.mocked(require('../../src/hooks/useMemberHome'));

// WeeklyBand mock — bağımsız bileşen, kendi testleri var
jest.mock('../../src/components/WeeklyBand', () => ({
  WeeklyBand: () => null,
}));

const PROGRAM_DAYS = [
  {
    id: 'day-0',
    dayOfWeek: 0,
    title: 'Üst Vücut',
    position: 0,
    isOneOff: false,
    specificDate: null,
    exercises: [],
  },
];

const ACTIVE_PROGRAM = {
  id: 'prog-1',
  trainerId: 't-1',
  memberId: 'm-1',
  status: 'active',
  days: PROGRAM_DAYS,
  publishedAt: '2026-06-01T00:00:00.000Z',
  archivedAt: null,
  hasUnreadUpdate: false,
};

const TODAY_WORKOUT = PROGRAM_DAYS[0]!;

function setupHooks(overrides: {
  isLoading?: boolean;
  isError?: boolean;
  data?: typeof ACTIVE_PROGRAM | null;
  todayWorkout?: typeof TODAY_WORKOUT | null;
  refetch?: jest.Mock;
  bannerShowing?: boolean;
  handleDismiss?: jest.Mock;
}) {
  memberHomeHooks.useMyActiveProgram.mockReturnValue({
    data: overrides.data ?? null,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    refetch: overrides.refetch ?? jest.fn(),
  });
  memberHomeHooks.getTodayWorkout.mockReturnValue(overrides.todayWorkout ?? null);
  memberHomeHooks.useProgramChangedBanner.mockReturnValue({
    isShowing: overrides.bannerShowing ?? false,
    handleDismiss: overrides.handleDismiss ?? jest.fn(),
  });
}

describe('MemberHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-01T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('yüklenirken skeleton ve loading indicator gösterilir', () => {
    setupHooks({ isLoading: true });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('home-loading-indicator')).toBeOnTheScreen();
    expect(getByTestId('loading-skeleton')).toBeOnTheScreen();
  });

  it('hata durumunda hata kartı ve Yenile butonu gösterilir', () => {
    setupHooks({ isError: true });
    const { getByTestId, getByText } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('error-card')).toBeOnTheScreen();
    expect(getByText('Yenile')).toBeOnTheScreen();
  });

  it('Yenile butonuna basılınca refetch çağrılır', () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    setupHooks({ isError: true, refetch });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    fireEvent.press(getByTestId('retry-button'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('program yokken bekleme kartı gösterilir', () => {
    setupHooks({ data: null });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('waiting-card')).toBeOnTheScreen();
  });

  it('bekleme kartında streak alanı görünmez (null render)', () => {
    setupHooks({ data: null });
    const { queryByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(queryByTestId('streak-area')).toBeNull();
  });

  it('program var + bugün antrenman varsa BUGÜN kartı ve CTA gösterilir', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: TODAY_WORKOUT });
    const { getByTestId, getByText } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('today-workout-card')).toBeOnTheScreen();
    expect(getByText('Antrenmana git →')).toBeOnTheScreen();
  });

  it('"Antrenmana git →" butonuna basılınca WorkoutScreen navigate edilir', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: TODAY_WORKOUT });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    fireEvent.press(getByTestId('go-to-workout-button'));
    expect(mockPush).toHaveBeenCalledWith(`/workout/${TODAY_WORKOUT.id}`);
  });

  it('program var ama bugün dinlenme günüyse dinlenme kartı gösterilir', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: null });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('rest-day-card')).toBeOnTheScreen();
  });

  it('program var ama bugün dinlenme günüyse "Bugün dinlenme günün" metni görünür', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: null });
    const { getByText } = renderWithProviders(<MemberHomeScreen />);
    expect(getByText('Bugün dinlenme günün')).toBeOnTheScreen();
  });

  // ── Program değişikliği banner testleri ─────────────────────────────────

  it('hasUnreadUpdate false ise banner gösterilmez', () => {
    setupHooks({ data: ACTIVE_PROGRAM, bannerShowing: false });
    const { queryByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(queryByTestId('program-changed-banner')).toBeNull();
  });

  it('banner gösterilince "Programında güncelleme var" metni görünür', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: TODAY_WORKOUT, bannerShowing: true });
    const { getByTestId, getByText } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('program-changed-banner')).toBeOnTheScreen();
    expect(getByText('Programında güncelleme var')).toBeOnTheScreen();
  });

  it('banner ✕ ile kapatılınca handleDismiss çağrılır', () => {
    const handleDismiss = jest.fn().mockResolvedValue(undefined);
    setupHooks({
      data: ACTIVE_PROGRAM,
      todayWorkout: TODAY_WORKOUT,
      bannerShowing: true,
      handleDismiss,
    });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    fireEvent.press(getByTestId('banner-dismiss-button'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('banner kapatılınca BUGÜN kartı etkilenmez', () => {
    setupHooks({ data: ACTIVE_PROGRAM, todayWorkout: TODAY_WORKOUT, bannerShowing: true });
    const { getByTestId } = renderWithProviders(<MemberHomeScreen />);
    expect(getByTestId('today-workout-card')).toBeOnTheScreen();
    expect(getByTestId('program-changed-banner')).toBeOnTheScreen();
  });
});
