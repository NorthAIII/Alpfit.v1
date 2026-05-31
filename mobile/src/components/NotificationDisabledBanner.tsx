// Bildirim izni kapalı banner'ı (TASK-3.11). Üye bildirim iznini reddetmişse
// home ekranında üstte gösterilir. Haftada bir kez gösterilir, kapatılabilir.
// Tıklanırsa cihaz ayarlarına yönlendirir.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useNotificationPermission } from '../hooks/useNotificationPermission';

/** AsyncStorage key — banner'ın son kapatılma zamanı (ISO timestamp). */
const DISMISSED_AT_KEY = 'notification:banner_dismissed_at';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Bildirim izni reddedilmişse ve son kapatmadan 7 gün geçmişse banner gösterir.
 * İzin verilmişse veya yükleme bitmemişse null döner.
 */
export function NotificationDisabledBanner() {
  const { granted, ready } = useNotificationPermission();
  const [visible, setVisible] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!ready || granted || checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    void AsyncStorage.getItem(DISMISSED_AT_KEY).then((value) => {
      if (value === null) {
        setVisible(true);
        return;
      }
      const dismissedAt = new Date(value).getTime();
      const now = Date.now();
      if (now - dismissedAt >= ONE_WEEK_MS) {
        setVisible(true);
      }
    });
  }, [ready, granted]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    void AsyncStorage.setItem(DISMISSED_AT_KEY, new Date().toISOString());
  }, []);

  const handleOpen = useCallback(() => {
    void Linking.openSettings();
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.banner} testID="notification-disabled-banner">
      <Pressable
        style={styles.main}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="Bildirim izni kapalı — reminder almıyorsun. Aç"
      >
        <Text style={styles.icon} accessibilityElementsHidden>
          🔕
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          Bildirim izni kapalı — reminder almıyorsun.{' '}
          <Text style={styles.link}>Aç →</Text>
        </Text>
      </Pressable>
      <Pressable
        style={styles.close}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        hitSlop={8}
        testID="dismiss-notification-banner"
      >
        <Text style={styles.closeLabel}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2230',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3346',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    color: '#9AA3B2',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  link: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  close: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  closeLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '700',
  },
});
