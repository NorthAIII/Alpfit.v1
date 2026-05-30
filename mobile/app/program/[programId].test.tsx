// ProgramBuilderScreen component testi.
// expo-router mock'lanır; jest.useFakeTimers ile bugünün günü sabitlenir
// (MEMORY: "Snapshot testleri tarih-bağımsız olmalı").
// 2026-06-01 = Pazartesi → JS getDay()=1 → Alpfit day=(1+6)%7=0 → "Pzt" aktif.

import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import ProgramBuilderScreen from './[programId]';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({
    programId: 'prog-1',
    memberId: 'm-1',
    memberFirstName: 'Ayşe',
    memberLastName: 'Kaya',
  }),
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
}));

// Pazartesi 2026-06-01 — sabit tarih (CI günü bağımsız)
const MONDAY = new Date('2026-06-01T08:00:00.000Z');

describe('ProgramBuilderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(MONDAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uye adi headerde gorunur', () => {
    const { getByText } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByText(/Ayşe Kaya/)).toBeOnTheScreen();
  });

  it('7 gün sekmesi render edilir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    for (let i = 0; i < 7; i++) {
      expect(getByTestId(`day-tab-${i}`)).toBeOnTheScreen();
    }
  });

  it('bugun Pazartesi (0=Pzt) aktif highlightlidir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    const pztTab = getByTestId('day-tab-0');
    expect(pztTab).toBeOnTheScreen();
    // accessibilityState.selected=true Pazartesi için
    expect(pztTab.props['accessibilityState']).toEqual({ selected: true });
    // Diğer sekme (Salı=1) selected=false
    expect(getByTestId('day-tab-1').props['accessibilityState']).toEqual({ selected: false });
  });

  it('sekmeye basılınca aktif gün değişir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);

    // Başta Pzt aktif
    expect(getByTestId('day-tab-0').props['accessibilityState']).toEqual({ selected: true });

    // Çarşamba'ya (2) bas
    fireEvent.press(getByTestId('day-tab-2'));

    expect(getByTestId('day-tab-2').props['accessibilityState']).toEqual({ selected: true });
    expect(getByTestId('day-tab-0').props['accessibilityState']).toEqual({ selected: false });
  });

  it('"Taslak" badge görünür', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('status-badge')).toBeOnTheScreen();
  });

  it('"Geri" butonu router.back çağırır', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('builder-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });
});
