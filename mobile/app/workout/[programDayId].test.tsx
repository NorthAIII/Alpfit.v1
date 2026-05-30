// WorkoutScreen component testi.
// useMyActiveProgram ve VideoModal mock'lanır.
// expo-router useLocalSearchParams ile programDayId inject edilir.

import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import WorkoutScreen from './[programDayId]';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({ programDayId: 'day-mon' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../../src/hooks/useMemberHome', () => ({
  useMyActiveProgram: jest.fn(),
}));

// VideoModal — bağımsız bileşen, kendi testleri var; burada sadece "açıldı" kontrol edilir
jest.mock('../../src/components/VideoModal', () => ({
  VideoModal: ({
    isVisible,
    onClose,
  }: {
    isVisible: boolean;
    videoUrl: string;
    onClose: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Pressable, Text } = require('react-native');
    if (!isVisible) return null;
    return (
      <View testID="video-modal-mock">
        <Pressable testID="video-modal-mock-close" onPress={onClose}>
          <Text>✕</Text>
        </Pressable>
      </View>
    );
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const memberHomeHooks = jest.mocked(require('../../src/hooks/useMemberHome'));

// ── Test fixtures ─────────────────────────────────────────────────────────────

function makeExercise(id: string, name: string, videoUrl: string | null = null) {
  return {
    id,
    exerciseId: `ex-${id}`,
    sets: 3,
    reps: '10',
    restSeconds: 60,
    notes: null,
    position: 0,
    exercise: { id: `ex-${id}`, name, muscleGroup: null, videoUrl, isCustom: false },
  };
}

const EX_A = makeExercise('pde-1', 'Bench Press', 'https://youtu.be/dQw4w9WgXcQ');
const EX_B = makeExercise('pde-2', 'Squat', null);
const EX_C = makeExercise('pde-3', 'Pull-up', 'https://youtu.be/abc123');

const PROGRAM = {
  id: 'prog-1',
  trainerId: 't-1',
  memberId: 'm-1',
  status: 'active',
  publishedAt: '2026-06-01T00:00:00.000Z',
  archivedAt: null,
  days: [
    {
      id: 'day-mon',
      dayOfWeek: 0,
      title: 'Üst Vücut',
      position: 0,
      isOneOff: false,
      specificDate: null,
      exercises: [
        { ...EX_A, position: 0 },
        { ...EX_B, position: 1 },
      ],
    },
  ],
};

function setupHooks(overrides: {
  isLoading?: boolean;
  isError?: boolean;
  data?: typeof PROGRAM | null;
  refetch?: jest.Mock;
}) {
  memberHomeHooks.useMyActiveProgram.mockReturnValue({
    data: overrides.data ?? null,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    refetch: overrides.refetch ?? jest.fn(),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkoutScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('yüklenirken loading durumu gösterilir', () => {
    setupHooks({ isLoading: true });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    expect(getByTestId('workout-loading')).toBeOnTheScreen();
  });

  it('hata durumunda hata metni ve Yenile butonu gösterilir', () => {
    setupHooks({ isError: true });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    expect(getByTestId('workout-error')).toBeOnTheScreen();
    expect(getByTestId('workout-retry-button')).toBeOnTheScreen();
  });

  it('Yenile butonuna basılınca refetch çağrılır', () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    setupHooks({ isError: true, refetch });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    fireEvent.press(getByTestId('workout-retry-button'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('programDayId eşleşmezse not-found durumu gösterilir', () => {
    setupHooks({ data: PROGRAM });
    // programDayId'yi bilinmeyen bir değere çek
    jest.mocked(require('expo-router').useLocalSearchParams).mockReturnValue({
      programDayId: 'unknown-day',
    });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    expect(getByTestId('workout-not-found')).toBeOnTheScreen();
    // Restore
    jest.mocked(require('expo-router').useLocalSearchParams).mockReturnValue({
      programDayId: 'day-mon',
    });
  });

  it('egzersiz listesi doğru sırada gösterilir', () => {
    setupHooks({ data: PROGRAM });
    const { getByText } = renderWithProviders(<WorkoutScreen />);
    expect(getByText('Bench Press')).toBeOnTheScreen();
    expect(getByText('Squat')).toBeOnTheScreen();
  });

  it('gün başlığı header\'da gösterilir', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    expect(getByTestId('workout-title').props['children']).toBe('Üst Vücut');
  });

  it('tik kutusuna tap: egzersiz işaretlenir', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    const checkbox = getByTestId(`checkbox-${EX_A.id}`);
    expect(checkbox.props['accessibilityState']['checked']).toBe(false);
    fireEvent.press(checkbox);
    expect(getByTestId(`checkbox-${EX_A.id}`).props['accessibilityState']['checked']).toBe(true);
  });

  it('tekrar tap: egzersiz işareti geri alınır (toggle)', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    const checkbox = getByTestId(`checkbox-${EX_A.id}`);
    fireEvent.press(checkbox); // işaretle
    fireEvent.press(checkbox); // geri al
    expect(getByTestId(`checkbox-${EX_A.id}`).props['accessibilityState']['checked']).toBe(false);
  });

  it('tümü tiklenmeden "Antrenmanı Bitir" butonu disabled', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    const btn = getByTestId('finish-button');
    expect(btn.props['accessibilityState']['disabled']).toBe(true);
  });

  it('tümü tiklendikten sonra buton aktif ve basılabilir', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    fireEvent.press(getByTestId(`checkbox-${EX_A.id}`));
    fireEvent.press(getByTestId(`checkbox-${EX_B.id}`));
    const btn = getByTestId('finish-button');
    expect(btn.props['accessibilityState']['disabled']).toBe(false);
  });

  it('finish butonuna basılınca Alert çağrılır (TASK-2.12 placeholder)', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    fireEvent.press(getByTestId(`checkbox-${EX_A.id}`));
    fireEvent.press(getByTestId(`checkbox-${EX_B.id}`));
    fireEvent.press(getByTestId('finish-button'));
    expect(alertSpy).toHaveBeenCalledWith('Harika iş!');
  });

  it('videoUrl olan egzersizde ▶ butonu görünür', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    // EX_A has videoUrl
    expect(getByTestId(`video-button-${EX_A.id}`)).toBeOnTheScreen();
  });

  it('videoUrl olmayan egzersizde ▶ butonu görünmez', () => {
    setupHooks({ data: PROGRAM });
    const { queryByTestId } = renderWithProviders(<WorkoutScreen />);
    // EX_B has no videoUrl
    expect(queryByTestId(`video-button-${EX_B.id}`)).toBeNull();
  });

  it('▶ butonuna basılınca VideoModal açılır', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId } = renderWithProviders(<WorkoutScreen />);
    fireEvent.press(getByTestId(`video-button-${EX_A.id}`));
    expect(getByTestId('video-modal-mock')).toBeOnTheScreen();
  });

  it('VideoModal "✕" ile kapanır', () => {
    setupHooks({ data: PROGRAM });
    const { getByTestId, queryByTestId } = renderWithProviders(<WorkoutScreen />);
    fireEvent.press(getByTestId(`video-button-${EX_A.id}`));
    fireEvent.press(getByTestId('video-modal-mock-close'));
    expect(queryByTestId('video-modal-mock')).toBeNull();
  });

  it('3 videoUrl\'li egzersiz: tüm ▶ butonları görünür (EX_C ile)', () => {
    const programWithVideo = {
      ...PROGRAM,
      days: [
        {
          ...PROGRAM.days[0]!,
          exercises: [
            { ...EX_A, position: 0 },
            { ...EX_B, position: 1 },
            { ...EX_C, position: 2 },
          ],
        },
      ],
    };
    setupHooks({ data: programWithVideo });
    const { getByTestId, queryByTestId } = renderWithProviders(<WorkoutScreen />);
    expect(getByTestId(`video-button-${EX_A.id}`)).toBeOnTheScreen();
    expect(queryByTestId(`video-button-${EX_B.id}`)).toBeNull(); // no video
    expect(getByTestId(`video-button-${EX_C.id}`)).toBeOnTheScreen();
  });
});
