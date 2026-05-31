// useNotificationPreferences hook testi (TASK-3.12).
// API mock'lanır — network çağrısı yapılmaz.

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNotificationPreferences } from './useNotificationPreferences';

jest.mock('../api/notification-preferences', () => ({
  getNotificationPreferences: jest.fn(),
  patchNotificationPreferences: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getNotificationPreferences, patchNotificationPreferences } = jest.mocked(
  require('../api/notification-preferences'),
);

const DEFAULT_PREFS = {
  reminderEnabled: true,
  comebackEnabled: true,
  systemEnabled: true,
  morningHour: 9,
  morningMinute: 0,
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('useNotificationPreferences — yükleme', () => {
  it('mount sonrası getNotificationPreferences çağrılır, data yüklenir', async () => {
    getNotificationPreferences.mockResolvedValueOnce(DEFAULT_PREFS);

    const { result } = renderHook(() => useNotificationPreferences());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getNotificationPreferences).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(DEFAULT_PREFS);
    expect(result.current.error).toBeNull();
  });

  it('API hata verirse error set edilir', async () => {
    getNotificationPreferences.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});

describe('useNotificationPreferences — update', () => {
  it('toggle değişimi: optimistic güncelleme + patchNotificationPreferences çağrılır', async () => {
    getNotificationPreferences.mockResolvedValueOnce(DEFAULT_PREFS);
    const patched = { ...DEFAULT_PREFS, reminderEnabled: false };
    patchNotificationPreferences.mockResolvedValueOnce(patched);

    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.update({ reminderEnabled: false });
    });

    expect(patchNotificationPreferences).toHaveBeenCalledWith({ reminderEnabled: false });
    expect(result.current.data?.reminderEnabled).toBe(false);
  });

  it('API hata verirse rollback: önceki state geri gelir', async () => {
    getNotificationPreferences.mockResolvedValueOnce(DEFAULT_PREFS);
    patchNotificationPreferences.mockRejectedValueOnce(new Error('server error'));

    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Önce optimistic: reminderEnabled false olur
    // Sonra hata: geri döner
    await act(async () => {
      await result.current.update({ reminderEnabled: false });
    });

    expect(result.current.data?.reminderEnabled).toBe(true); // rollback
    expect(result.current.error).not.toBeNull();
  });

  it('data null iken update çağrılırsa patchNotificationPreferences çağrılmaz', async () => {
    getNotificationPreferences.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.update({ reminderEnabled: false });
    });

    expect(patchNotificationPreferences).not.toHaveBeenCalled();
  });
});
