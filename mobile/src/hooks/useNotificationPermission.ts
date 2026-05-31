// Bildirim izni yönetimi hook'u (TASK-3.11).
// Mevcut izin durumunu okur, native diyalogu tetikler.

import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';

export interface NotificationPermissionState {
  /** İzin verildi mi? (undetermined → false, ne zaman verilse true olur). */
  granted: boolean;
  /** Yükleme tamamlandı mı? İlk render'da false — UI loading state için. */
  ready: boolean;
  /** Native izin diyaloğunu göster. iOS'ta ikinci kez çağrılırsa cihaz ayarlarına yönlendir. */
  requestPermission: () => Promise<boolean>;
}

/**
 * Push bildirim iznini yönetir.
 *
 * - Mount'ta mevcut durumu `getPermissionsAsync()` ile okur.
 * - `requestPermission()` native diyalogu açar; iOS'ta bir kez gösterilebilir
 *   (sistem kısıtlaması). İkinci kez çağrıldığında zaten `granted`'ı döner
 *   (reddetmişse false, vermiş ise true).
 * - Simulator'da `granted: false` döner, hata fırlatmaz.
 */
export function useNotificationPermission(): NotificationPermissionState {
  const [granted, setGranted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Notifications.getPermissionsAsync()
      .then(({ granted: g, ios }) => {
        // iOS'ta hem `granted` hem de `ios.status === AUTHORIZED | PROVISIONAL` kontrol edilir.
        const isGranted =
          g ||
          ios?.status === IosAuthorizationStatus.AUTHORIZED ||
          ios?.status === IosAuthorizationStatus.PROVISIONAL;
        setGranted(isGranted);
      })
      .catch(() => {
        // Simulator veya hata: granted false kalır.
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted: g } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      setGranted(g);
      return g;
    } catch {
      return false;
    }
  }, []);

  return { granted, ready, requestPermission };
}
