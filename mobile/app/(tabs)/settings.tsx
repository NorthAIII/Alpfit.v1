import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logout, logoutAll } from '../../src/api/auth';
import { clearSession, useSessionStore } from '../../src/auth/session';
import { clearPushToken } from '../../src/hooks/usePushToken';

// Ayarlar ekranı — minimum (TASK-1.33). v1 Auth fazında tek işlev: çıkış. PT
// "Üyeler" sekmesinin yanında yer alır (member-side ayarlar/sekme yapısı sonraki
// fazlarda). Çıkış iki seçenek: bu cihaz (`/auth/logout`) ya da tüm cihazlar
// (`/auth/logout-all`). Her seçenek için iki adımlı satır-içi onay (Alert yerine
// — platform-agnostik + test edilebilir). Çıkış sunucu hatasında bile yerel
// oturumu temizler (kullanıcı çıkmak istiyor); ardından landing'e döner.

type Pending = 'none' | 'one' | 'all';

export default function SettingsScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const [confirming, setConfirming] = useState<Pending>('none');
  const [busy, setBusy] = useState(false);

  const doLogout = useCallback(
    async (scope: 'one' | 'all') => {
      if (busy) {
        return;
      }
      setBusy(true);
      const { accessToken, refreshToken } = useSessionStore.getState();

      // Access token yoksa zaten oturum yok — yine de yerel temizlik + landing.
      if (accessToken !== undefined) {
        if (scope === 'all') {
          await logoutAll(accessToken);
        } else if (refreshToken !== undefined) {
          await logout(accessToken, refreshToken);
        }
      }

      // Push token'ı backend'den sil (hata sessizce yutulur — çıkışı engellememeli).
      await clearPushToken();
      // Sunucu sonucu ne olursa olsun yerel oturumu temizle (bellek + SecureStore).
      await clearSession();
      router.replace('/');
    },
    [busy, router],
  );

  const renderRow = (scope: 'one' | 'all') => {
    const isConfirming = confirming === (scope === 'one' ? 'one' : 'all');
    const label = scope === 'one' ? t('session.logout') : t('session.logoutAll');
    const hint = scope === 'one' ? t('session.logoutHint') : t('session.logoutAllHint');
    const confirmText =
      scope === 'one' ? t('session.confirmLogout') : t('session.confirmLogoutAll');

    return (
      <View style={styles.row}>
        <Pressable
          style={[styles.actionButton, scope === 'all' && styles.dangerButton]}
          onPress={() => setConfirming(scope)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={[styles.actionLabel, scope === 'all' && styles.dangerLabel]}>{label}</Text>
        </Pressable>
        <Text style={styles.hint}>{hint}</Text>

        {isConfirming ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText} accessibilityRole="alert">
              {confirmText}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setConfirming('none')}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('session.cancel')}
              >
                <Text style={styles.cancelLabel}>{t('session.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={() => void doLogout(scope)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('session.confirm')}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLabel}>{t('session.confirm')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {t('title')}
      </Text>

      <Text style={styles.sectionHeading}>{t('session.heading')}</Text>
      {renderRow('one')}
      {renderRow('all')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 32,
  },
  sectionHeading: {
    color: '#9AA3B2',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    marginBottom: 24,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerButton: {
    borderColor: '#7F1D1D',
  },
  actionLabel: {
    color: '#E4E8EF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerLabel: {
    color: '#F87171',
  },
  hint: {
    color: '#5A6373',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  confirmBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#2A2F3A',
    gap: 12,
  },
  confirmText: {
    color: '#E4E8EF',
    fontSize: 15,
    lineHeight: 21,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2F3A',
  },
  cancelLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  confirmLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
