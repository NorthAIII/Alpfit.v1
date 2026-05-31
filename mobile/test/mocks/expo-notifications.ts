// expo-notifications test mock'u (TASK-3.11).
// Native bildirim modülü Jest ortamında çalışmaz (simulator kısıtlaması);
// API yüzeyini minimal mock ile taklit eder. jest.config moduleNameMapper
// bu dosyayı `expo-notifications` yerine bağlar.

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionsStatus {
  granted: boolean;
  ios?: { status: PermissionStatus };
}

let _permissionGranted = false;

/** Test içinden izin durumunu set et. */
export function __setPermissionGranted(granted: boolean): void {
  _permissionGranted = granted;
}

export function __resetNotifications(): void {
  _permissionGranted = false;
}

export const getPermissionsAsync = jest.fn(
  async (): Promise<NotificationPermissionsStatus> => ({
    granted: _permissionGranted,
    ios: { status: _permissionGranted ? 'granted' : 'undetermined' },
  }),
);

export const requestPermissionsAsync = jest.fn(
  async (): Promise<NotificationPermissionsStatus> => ({
    granted: _permissionGranted,
  }),
);

export const getExpoPushTokenAsync = jest.fn(
  async (): Promise<{ data: string }> => ({
    data: 'ExponentPushToken[test-token-123]',
  }),
);

export const setNotificationHandler = jest.fn();
export const addNotificationReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
export const addNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
