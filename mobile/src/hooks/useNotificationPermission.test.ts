// useNotificationPermission hook testi (TASK-3.11).
// expo-notifications mock'lanir — izin state'i test icinden kontrol edilir.

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNotificationPermission } from './useNotificationPermission';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = jest.mocked(require('expo-notifications'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __setPermissionGranted } = require('../../test/mocks/expo-notifications') as {
  __setPermissionGranted: (v: boolean) => void;
};

describe('useNotificationPermission', () => {
  it('izin verilmemisse granted false, ready true doner', async () => {
    __setPermissionGranted(false);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.granted).toBe(false);
  });

  it('izin verilmisse granted true, ready true doner', async () => {
    __setPermissionGranted(true);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.granted).toBe(true);
  });

  it('requestPermission izin verilince true doner ve state guncellenir', async () => {
    __setPermissionGranted(false);
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: true });

    const { result } = renderHook(() => useNotificationPermission());
    await waitFor(() => expect(result.current.ready).toBe(true));

    let permResult: boolean | undefined;
    await act(async () => {
      permResult = await result.current.requestPermission();
    });

    expect(permResult).toBe(true);
    expect(result.current.granted).toBe(true);
  });

  it('requestPermission izin reddedilince false doner', async () => {
    __setPermissionGranted(false);
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { result } = renderHook(() => useNotificationPermission());
    await waitFor(() => expect(result.current.ready).toBe(true));

    let permResult: boolean | undefined;
    await act(async () => {
      permResult = await result.current.requestPermission();
    });

    expect(permResult).toBe(false);
    expect(result.current.granted).toBe(false);
  });

  it('getPermissionsAsync hata firlatirsa granted false kalir, ready true olur', async () => {
    Notifications.getPermissionsAsync.mockRejectedValueOnce(new Error('no-native'));

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.granted).toBe(false);
  });
});
