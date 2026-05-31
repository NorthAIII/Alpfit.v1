// usePushToken hook testi (TASK-3.11).
// expo-notifications mock'lanir — gercek push token alinamaz (simulator/Jest).

import { renderHook, waitFor } from '@testing-library/react-native';

import { clearPushToken, getCurrentPushToken, usePushToken } from './usePushToken';

jest.mock('../api/push-tokens', () => ({
  registerPushToken: jest.fn().mockResolvedValue(undefined),
  deletePushToken: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerPushToken, deletePushToken } = jest.mocked(require('../api/push-tokens'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = jest.mocked(require('expo-notifications'));

afterEach(async () => {
  // _currentToken modül-level degisken; testler arasi sifirla.
  await clearPushToken();
  jest.clearAllMocks();
});

describe('usePushToken', () => {
  it('mount sonrasi token alip backend kaydeder', async () => {
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[abc123]',
    });

    renderHook(() => usePushToken());

    await waitFor(() => {
      expect(registerPushToken).toHaveBeenCalledWith(
        'ExponentPushToken[abc123]',
        expect.any(String),
      );
    });

    expect(getCurrentPushToken()).toBe('ExponentPushToken[abc123]');
  });

  it('getExpoPushTokenAsync hata firlatirsa akis cokmez', async () => {
    Notifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('simulator'));

    // Hata try/catch icinde yutulur — hook crash olmaz, registerPushToken cagirilmaz.
    renderHook(() => usePushToken());

    await waitFor(() => {
      expect(registerPushToken).not.toHaveBeenCalled();
    });

    expect(getCurrentPushToken()).toBeNull();
  });
});

describe('clearPushToken', () => {
  it('token varsa deletePushToken cagirilir', async () => {
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[del]',
    });

    renderHook(() => usePushToken());

    await waitFor(() => {
      expect(getCurrentPushToken()).toBe('ExponentPushToken[del]');
    });

    await clearPushToken();

    expect(deletePushToken).toHaveBeenCalledWith('ExponentPushToken[del]');
    expect(getCurrentPushToken()).toBeNull();
  });

  it('token yoksa deletePushToken cagirilmaz', async () => {
    await clearPushToken();
    expect(deletePushToken).not.toHaveBeenCalled();
  });
});
