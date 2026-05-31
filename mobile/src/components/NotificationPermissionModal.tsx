// Bildirim izni açıklama ekranı (TASK-3.11). Native diyalogdan önce gösterilen
// in-app modal — kullanıcı neden izin istediğimizi anlasın. İlk antrenman
// tamamlandıktan sonra bir kez gösterilir.

import { useCallback } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { registerPushToken } from '../api/push-tokens';
import { setCurrentPushToken } from '../hooks/usePushToken';

export interface NotificationPermissionModalProps {
  visible: boolean;
  /** "İzin Ver" veya "Şimdi Değil" seçilince çağrılır. */
  onDismiss: () => void;
}

/**
 * İzin açıklama + native diyalog ekranı.
 *
 * - "İzin Ver": `requestPermissionsAsync()` → izin verilirse token alıp backend'e kaydeder.
 *   İzin zaten reddedilmiş (sistem kısıtlaması) veya yeni reddedilirse cihaz ayarlarına yönlendirir.
 * - "Şimdi Değil": modal kapanır; tekrar açılması çağıran tarafın flag'ine bağlıdır.
 */
export function NotificationPermissionModal({
  visible,
  onDismiss,
}: NotificationPermissionModalProps) {
  const { granted, requestPermission } = useNotificationPermission();

  const handleAllow = useCallback(async () => {
    if (granted) {
      onDismiss();
      return;
    }

    const wasGranted = await requestPermission();

    if (wasGranted) {
      // Token al ve backend'e kaydet.
      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        setCurrentPushToken(token);
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerPushToken(token, platform);
      } catch {
        // Simulator'da push token alınamaz — akışı engelleme.
      }
    } else {
      // İzin reddedildi → cihaz ayarlarına yönlendir.
      await Linking.openSettings();
    }

    onDismiss();
  }, [granted, requestPermission, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji} accessibilityElementsHidden>
            🔔
          </Text>
          <Text style={styles.title} accessibilityRole="header">
            Hatırlatıcılara izin ver
          </Text>
          <Text style={styles.body}>
            Antrenman hatırlatıcıları sayesinde programını aksatmadan sürdürebilirsin. Bildirimleri
            istediğin zaman ayarlardan kapatabilirsin.
          </Text>

          <Pressable
            style={styles.allowButton}
            onPress={() => void handleAllow()}
            accessibilityRole="button"
            accessibilityLabel="Bildirim iznine izin ver"
            testID="allow-button"
          >
            <Text style={styles.allowLabel}>İzin Ver</Text>
          </Pressable>

          <Pressable
            style={styles.laterButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Şimdi değil"
            testID="later-button"
          >
            <Text style={styles.laterLabel}>Şimdi Değil</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1B2230',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3346',
    gap: 12,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: '#9AA3B2',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  allowButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  allowLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  laterLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '500',
  },
});
