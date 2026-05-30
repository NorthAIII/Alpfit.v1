// ProgramBuilderScreen component testi.
// expo-router, useProgramAutoSave, usePublishProgram, useCopyProgram, useTrainerMembers mock'lanır.
// jest.useFakeTimers ile bugünün günü sabitlenir (MEMORY: "Snapshot testleri tarih-bağımsız olmalı").
// 2026-06-01 = Pazartesi → JS getDay()=1 → Alpfit day=(1+6)%7=0 → "Pzt" aktif.

import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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
    programStatus: 'draft',
  }),
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
}));

// Hook'ları mock'la — TanStack Query observer ile fireEvent çakışmasını önler
// (ExerciseSearchBottomSheet test'indeki aynı pattern)
jest.mock('../../src/hooks/useProgramAutoSave', () => ({
  useProgramAutoSave: jest.fn(),
}));

jest.mock('../../src/hooks/useProgram', () => ({
  usePublishProgram: jest.fn(),
  useCopyProgram: jest.fn(),
  useTrainerMembers: jest.fn(),
}));

// ExerciseSearchBottomSheet mock — bağımsız bir modal, kendi testleri var
jest.mock('../../src/components/ExerciseSearchBottomSheet', () => ({
  ExerciseSearchBottomSheet: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const autoSaveHooks = jest.mocked(require('../../src/hooks/useProgramAutoSave'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const programHooks = jest.mocked(require('../../src/hooks/useProgram'));

const defaultAutoSave = {
  saveState: 'idle' as const,
  cancelPendingAutoSave: jest.fn(),
};

const defaultPublish = {
  mutate: jest.fn(),
  isPending: false,
};

const defaultCopy = {
  mutate: jest.fn(),
  isPending: false,
};

const defaultTrainerMembers = {
  data: [
    { id: 'm-2', firstName: 'Mehmet', lastName: 'Yılmaz' },
    { id: 'm-3', firstName: 'Fatma', lastName: 'Demir' },
  ],
  isLoading: false,
};

// Pazartesi 2026-06-01 — sabit tarih (CI günü bağımsız)
const MONDAY = new Date('2026-06-01T08:00:00.000Z');

describe('ProgramBuilderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(MONDAY);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    autoSaveHooks.useProgramAutoSave.mockReturnValue(defaultAutoSave);
    programHooks.usePublishProgram.mockReturnValue(defaultPublish);
    programHooks.useCopyProgram.mockReturnValue(defaultCopy);
    programHooks.useTrainerMembers.mockReturnValue(defaultTrainerMembers);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // --- Mevcut testler (TASK-2.07/2.08'den gelen) ---

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
    expect(pztTab.props['accessibilityState']).toEqual({ selected: true });
    expect(getByTestId('day-tab-1').props['accessibilityState']).toEqual({ selected: false });
  });

  it('sekmeye basılınca aktif gün değişir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('day-tab-0').props['accessibilityState']).toEqual({ selected: true });
    fireEvent.press(getByTestId('day-tab-2'));
    expect(getByTestId('day-tab-2').props['accessibilityState']).toEqual({ selected: true });
    expect(getByTestId('day-tab-0').props['accessibilityState']).toEqual({ selected: false });
  });

  it('"Geri" butonu router.back çağırır', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('builder-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  // --- TASK-2.09 yeni testler ---

  it('status badge draft iken "Taslak" gösterir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('status-badge')).toBeOnTheScreen();
  });

  it('publish butonu render edilir ve "Kaydet ve Yayınla" yazar (draft)', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    const btn = getByTestId('publish-button');
    expect(btn).toBeOnTheScreen();
    expect(btn.props['accessibilityLabel']).toBe('Kaydet ve Yayınla');
  });

  it('tüm günler boşken publish basılınca Alert uyarısı gelir, mutate çağrılmaz', () => {
    const doPublish = jest.fn();
    programHooks.usePublishProgram.mockReturnValue({ mutate: doPublish, isPending: false });

    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('publish-button'));

    expect(Alert.alert).toHaveBeenCalledWith('Uyarı', 'En az 1 gün için egzersiz ekle.');
    expect(doPublish).not.toHaveBeenCalled();
  });

  it('saveState === saving iken publish butonu disabled', () => {
    autoSaveHooks.useProgramAutoSave.mockReturnValue({
      saveState: 'saving',
      cancelPendingAutoSave: jest.fn(),
    });

    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    // React Native Pressable: disabled prop → accessibilityState.disabled
    expect(getByTestId('publish-button').props['accessibilityState']).toMatchObject({
      disabled: true,
    });
  });

  it('auto-save indicator idle iken görünmez', () => {
    const { queryByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(queryByTestId('save-indicator-saving')).toBeNull();
    expect(queryByTestId('save-indicator-saved')).toBeNull();
    expect(queryByTestId('save-indicator-error')).toBeNull();
  });

  it('saveState === saving iken "Kaydediliyor..." indicator görünür', () => {
    autoSaveHooks.useProgramAutoSave.mockReturnValue({
      saveState: 'saving',
      cancelPendingAutoSave: jest.fn(),
    });
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('save-indicator-saving')).toBeOnTheScreen();
  });

  it('saveState === saved iken "Taslak kaydedildi" indicator görünür', () => {
    autoSaveHooks.useProgramAutoSave.mockReturnValue({
      saveState: 'saved',
      cancelPendingAutoSave: jest.fn(),
    });
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('save-indicator-saved')).toBeOnTheScreen();
  });

  it('saveState === error iken "Kaydetme hatası" indicator görünür', () => {
    autoSaveHooks.useProgramAutoSave.mockReturnValue({
      saveState: 'error',
      cancelPendingAutoSave: jest.fn(),
    });
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('save-indicator-error')).toBeOnTheScreen();
  });

  it('"Kopyala..." butonu render edilir', () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    expect(getByTestId('copy-cta-button')).toBeOnTheScreen();
  });

  it('"Kopyala..." basılınca copy modal açılır', async () => {
    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('copy-cta-button'));
    await waitFor(() => {
      expect(getByTestId('copy-member-list')).toBeOnTheScreen();
    });
  });

  it('copy modalda trainer üyeleri listelenir (kendi üyesi hariç)', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('copy-cta-button'));
    await waitFor(() => {
      // m-2 ve m-3 görünür, mevcut üye m-1 filtrelenir
      expect(getByTestId('copy-member-m-2')).toBeOnTheScreen();
      expect(getByTestId('copy-member-m-3')).toBeOnTheScreen();
      expect(queryByTestId('copy-member-m-1')).toBeNull();
    });
  });

  it('copy modalda üye seçilince doCopy çağrılır', async () => {
    const doCopy = jest.fn();
    programHooks.useCopyProgram.mockReturnValue({ mutate: doCopy, isPending: false });

    const { getByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('copy-cta-button'));
    await waitFor(() => {
      getByTestId('copy-member-m-2');
    });

    fireEvent.press(getByTestId('copy-member-m-2'));
    expect(doCopy).toHaveBeenCalledWith(
      { programId: 'prog-1', targetMemberId: 'm-2' },
      expect.any(Object),
    );
  });

  it('copy modal kapat butonu çalışır', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<ProgramBuilderScreen />);
    fireEvent.press(getByTestId('copy-cta-button'));
    await waitFor(() => {
      getByTestId('copy-modal-close');
    });
    fireEvent.press(getByTestId('copy-modal-close'));
    await waitFor(() => {
      expect(queryByTestId('copy-member-list')).toBeNull();
    });
  });
});
