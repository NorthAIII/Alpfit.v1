// NotificationPermissionModal bileşen testi (TASK-3.11).
// expo-notifications ve push-tokens API mock'lanır.

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { NotificationPermissionModal } from './NotificationPermissionModal';

jest.mock('../api/push-tokens', () => ({
  registerPushToken: jest.fn().mockResolvedValue(undefined),
  deletePushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../hooks/usePushToken', () => ({
  setCurrentPushToken: jest.fn(),
  getCurrentPushToken: jest.fn().mockReturnValue(null),
  clearPushToken: jest.fn().mockResolvedValue(undefined),
  usePushToken: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = jest.mocked(require('expo-notifications'));

describe('NotificationPermissionModal', () => {
  it('visible=false iken hiçbir şey göstermez', () => {
    const { queryByTestId } = render(
      <NotificationPermissionModal visible={false} onDismiss={jest.fn()} />,
    );
    expect(queryByTestId('allow-button')).toBeNull();
    expect(queryByTestId('later-button')).toBeNull();
  });

  it('visible=true iken "İzin Ver" ve "Şimdi Değil" butonlarını gösterir', async () => {
    const { getByTestId } = render(
      <NotificationPermissionModal visible={true} onDismiss={jest.fn()} />,
    );
    await waitFor(() => {
      expect(getByTestId('allow-button')).toBeTruthy();
      expect(getByTestId('later-button')).toBeTruthy();
    });
  });

  it('"Şimdi Değil" tıklanınca onDismiss çağrılır', async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <NotificationPermissionModal visible={true} onDismiss={onDismiss} />,
    );

    await waitFor(() => getByTestId('later-button'));
    fireEvent.press(getByTestId('later-button'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('"İzin Ver" izin verilince onDismiss ve registerPushToken çağrılır', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: true });
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[modal-test]',
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerPushToken } = jest.mocked(require('../api/push-tokens'));
    const onDismiss = jest.fn();

    const { getByTestId } = render(
      <NotificationPermissionModal visible={true} onDismiss={onDismiss} />,
    );

    await waitFor(() => getByTestId('allow-button'));
    await act(async () => {
      fireEvent.press(getByTestId('allow-button'));
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
      expect(registerPushToken).toHaveBeenCalledWith(
        'ExponentPushToken[modal-test]',
        expect.any(String),
      );
    });
  });
});
