// NotificationPreferencesScreen bileşen testi (TASK-3.12).
// useNotificationPreferences ve useNotificationPermission mock'lanır.

import { act, fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';
import { NotificationPreferencesScreen } from './NotificationPreferencesScreen';

jest.mock('../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: jest.fn(),
}));

jest.mock('../hooks/useNotificationPermission', () => ({
  useNotificationPermission: jest.fn(),
}));

jest.mock('../auth/session', () => ({
  useSessionStore: jest.fn((selector: (s: { role: string }) => unknown) =>
    selector({ role: 'member' }),
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useNotificationPreferences } = jest.mocked(require('../hooks/useNotificationPreferences'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useNotificationPermission } = jest.mocked(require('../hooks/useNotificationPermission'));

const DEFAULT_PREFS = {
  reminderEnabled: true,
  comebackEnabled: true,
  systemEnabled: true,
  morningHour: 9,
  morningMinute: 0,
};

function setupMocks({
  data = DEFAULT_PREFS,
  isLoading = false,
  granted = true,
  update = jest.fn().mockResolvedValue(undefined),
}: {
  data?: typeof DEFAULT_PREFS | null;
  isLoading?: boolean;
  granted?: boolean;
  update?: jest.Mock;
} = {}) {
  useNotificationPreferences.mockReturnValue({ data, isLoading, error: null, update });
  useNotificationPermission.mockReturnValue({ granted, ready: true, requestPermission: jest.fn() });
  return { update };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('NotificationPreferencesScreen — ilk yükleme', () => {
  it('yüklenirken loading göstergesi görünür', () => {
    setupMocks({ isLoading: true, data: null });
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);
    expect(getByTestId('prefs-loading')).toBeTruthy();
  });

  it('data yüklendikten sonra toggle değerleri görünür', async () => {
    setupMocks();
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => {
      expect(getByTestId('reminder-toggle')).toBeTruthy();
    });
    expect(getByTestId('comeback-toggle')).toBeTruthy();
    expect(getByTestId('system-toggle')).toBeTruthy();
  });

  it('saat 09:00 olarak gösterilir (data.morningHour=9, morningMinute=0)', async () => {
    setupMocks();
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => {
      expect(getByTestId('hour-display').props.children).toBe('09');
      expect(getByTestId('minute-display').props.children).toBe('00');
    });
  });
});

describe('NotificationPreferencesScreen — toggle aksiyonları', () => {
  it('reminder toggle kapatılınca update({ reminderEnabled: false }) çağrılır', async () => {
    const { update } = setupMocks();
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => getByTestId('reminder-toggle'));

    await act(async () => {
      fireEvent(getByTestId('reminder-toggle'), 'valueChange', false);
    });

    expect(update).toHaveBeenCalledWith({ reminderEnabled: false });
  });

  it('comeback toggle kapatılınca update({ comebackEnabled: false }) çağrılır', async () => {
    const { update } = setupMocks();
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => getByTestId('comeback-toggle'));

    await act(async () => {
      fireEvent(getByTestId('comeback-toggle'), 'valueChange', false);
    });

    expect(update).toHaveBeenCalledWith({ comebackEnabled: false });
  });
});

describe('NotificationPreferencesScreen — saat seçici + debounce', () => {
  it('saat azalt butonuna 2 kez basılıp 500ms beklendikten sonra update({morningHour:7, morningMinute:0}) çağrılır', async () => {
    jest.useFakeTimers();
    try {
      const { update } = setupMocks();
      const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

      // data'dan saat init edilsin
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => expect(getByTestId('hour-display').props.children).toBe('09'));

      // 9 → 8 → 7
      await act(async () => {
        fireEvent.press(getByTestId('hour-decrement'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('hour-decrement'));
      });

      // debounce süresi geçsin
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      expect(update).toHaveBeenCalledWith({ morningHour: 7, morningMinute: 0 });
    } finally {
      jest.useRealTimers();
    }
  });

  it('saat artır butonuna basılınca saat görüntüsü güncellenir', async () => {
    jest.useFakeTimers();
    try {
      setupMocks();
      const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => expect(getByTestId('hour-display').props.children).toBe('09'));

      await act(async () => {
        fireEvent.press(getByTestId('hour-increment'));
      });

      expect(getByTestId('hour-display').props.children).toBe('10');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('NotificationPreferencesScreen — bildirim izni', () => {
  it('izin kapalıysa permission banner ve "İzin ver" butonu görünür', async () => {
    setupMocks({ granted: false });
    const { getByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => {
      expect(getByTestId('permission-banner')).toBeTruthy();
      expect(getByTestId('open-settings-button')).toBeTruthy();
    });
  });

  it('izin açıksa permission banner görünmez', async () => {
    setupMocks({ granted: true });
    const { queryByTestId } = renderWithProviders(<NotificationPreferencesScreen />);

    await waitFor(() => queryByTestId('reminder-toggle'));

    expect(queryByTestId('permission-banner')).toBeNull();
  });
});

describe('NotificationPreferencesScreen — role guard', () => {
  it('trainer rolündeyse hiçbir şey render edilmez', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSessionStore } = jest.mocked(require('../auth/session'));
    useSessionStore.mockImplementation((selector: (s: { role: string }) => unknown) =>
      selector({ role: 'trainer' }),
    );
    setupMocks();

    const { queryByTestId } = renderWithProviders(<NotificationPreferencesScreen />);
    expect(queryByTestId('reminder-toggle')).toBeNull();
    expect(queryByTestId('prefs-loading')).toBeNull();

    // Reset mock
    useSessionStore.mockImplementation((selector: (s: { role: string }) => unknown) =>
      selector({ role: 'member' }),
    );
  });
});
