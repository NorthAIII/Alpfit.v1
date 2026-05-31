// Push token alma + backend kaydetme hook'u (TASK-3.11).
// App her açılışında mount'ta çalışır; token'ı alıp backend'e idem-potent kaydeder.

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { deletePushToken, registerPushToken } from '../api/push-tokens';

/** Aktif token'ı bellek'te tutar — logout sırasında erişim için. */
let _currentToken: string | null = null;

/** Bu oturumun push token'ını döner. Token alınamadıysa `null`. */
export function getCurrentPushToken(): string | null {
  return _currentToken;
}

/** Token'ı dışarıdan set eder (örn. izin modal'ı token alınca). */
export function setCurrentPushToken(token: string): void {
  _currentToken = token;
}

/**
 * Mount'ta Expo push token alır ve backend'e kaydeder. Bağımlılık listesi boş —
 * yalnızca mount'ta bir kez çalışır; token yenileme otomatik (Expo rotasyonu).
 *
 * - Simulator'da `getExpoPushTokenAsync` hata fırlatır → try/catch ile yutar,
 *   akışı engellemez.
 * - İzin verilmemiş olsa bile token almayı dener; sistem sessizce reddederse
 *   hata yutulur.
 */
export function usePushToken(): void {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) {
      return;
    }
    didRun.current = true;

    void (async () => {
      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        _currentToken = token;
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerPushToken(token, platform);
      } catch {
        // Simulator'da push token alınamaz — akışı engelleme, sessizce devam.
      }
    })();
  }, []);
}

/**
 * Logout sırasında mevcut token'ı backend'den siler ve bellek referansını temizler.
 * `deletePushToken` içinde ağ hataları zaten yutulur.
 */
export async function clearPushToken(): Promise<void> {
  if (_currentToken !== null) {
    const token = _currentToken;
    _currentToken = null;
    await deletePushToken(token);
  }
}
