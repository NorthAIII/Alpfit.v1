// Bildirim Tercihleri ekranı — Ayarlar > Bildirimler (TASK-3.12).
// Member-only: trainer bu ekrana erişemez (role guard).
// Toggle'lar optimistic güncelleme yapar. Sabah saati +/− butonlarıyla
// değiştirilir ve 500ms debounce sonrası backend'e gönderilir.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useSessionStore } from '../auth/session';
import { useDebounce } from '../hooks/useDebounce';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

export function NotificationPreferencesScreen() {
  const role = useSessionStore((s) => s.role);
  const { granted, ready: permReady } = useNotificationPermission();
  const { data, isLoading, update } = useNotificationPreferences();

  // Saat seçici için yerel state — data'dan ilk yüklemede set edilir.
  const [localHour, setLocalHour] = useState(9);
  const [localMinute, setLocalMinute] = useState(0);
  const timeInitializedRef = useRef(false);
  const userChangedTimeRef = useRef(false);

  const debouncedHour = useDebounce(localHour, 500);
  const debouncedMinute = useDebounce(localMinute, 500);

  // Data ilk geldiğinde yerel saat state'ini set et (sonrasını kullanıcı değiştirir).
  useEffect(() => {
    if (data && !timeInitializedRef.current) {
      timeInitializedRef.current = true;
      setLocalHour(data.morningHour);
      setLocalMinute(data.morningMinute);
    }
  }, [data]);

  // Debounce süresi dolunca backend'e gönder (yalnızca kullanıcı değiştirmişse).
  useEffect(() => {
    if (!userChangedTimeRef.current) {
      return;
    }
    void update({ morningHour: debouncedHour, morningMinute: debouncedMinute });
    // update referansı sabit (useCallback [] dep) — dependency'ye eklenmesi gereksiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHour, debouncedMinute]);

  const handleHourChange = useCallback((delta: number) => {
    userChangedTimeRef.current = true;
    setLocalHour((h) => ((h + delta + 24) % 24));
  }, []);

  const handleMinuteChange = useCallback((delta: number) => {
    userChangedTimeRef.current = true;
    // 15 dakika adımı
    setLocalMinute((m) => ((m + delta + 60) % 60));
  }, []);

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  // PT bu ekrana erişemez.
  if (role === 'trainer') {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#3B82F6" testID="prefs-loading" />
      </View>
    );
  }

  const reminderEnabled = data?.reminderEnabled ?? true;
  const comebackEnabled = data?.comebackEnabled ?? true;
  const systemEnabled = data?.systemEnabled ?? true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Bildirimler
      </Text>

      {/* İzin kapalıysa uyarı banner */}
      {permReady && !granted ? (
        <View style={styles.permBanner} testID="permission-banner">
          <Text style={styles.permBannerText}>
            Bildirim izni kapalı — push bildirimleri almıyorsun.
          </Text>
          <Pressable
            style={styles.permButton}
            onPress={handleOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Bildirim izni ver"
            testID="open-settings-button"
          >
            <Text style={styles.permButtonLabel}>İzin ver</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Bildirim toggle'ları */}
      <Text style={styles.sectionHeading}>BİLDİRİM TERCİHLERİ</Text>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Hatırlatıcı bildirimleri</Text>
          <Text style={styles.rowHint}>Sabah hatırlatıcısı ve antrenmandan önce</Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={(v) => void update({ reminderEnabled: v })}
          trackColor={{ false: '#2A2F3A', true: '#1D4ED8' }}
          thumbColor="#FFFFFF"
          testID="reminder-toggle"
          accessibilityLabel="Hatırlatıcı bildirimleri"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Geri dönüş bildirimleri</Text>
          <Text style={styles.rowHint}>Antrenmana ara verince teşvik bildirimleri</Text>
        </View>
        <Switch
          value={comebackEnabled}
          onValueChange={(v) => void update({ comebackEnabled: v })}
          trackColor={{ false: '#2A2F3A', true: '#1D4ED8' }}
          thumbColor="#FFFFFF"
          testID="comeback-toggle"
          accessibilityLabel="Geri dönüş bildirimleri"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Sistem bildirimleri</Text>
          <Text style={styles.rowHint}>Hesap güvenliği ve önemli güncellemeler</Text>
        </View>
        <Switch
          value={systemEnabled}
          onValueChange={(v) => void update({ systemEnabled: v })}
          trackColor={{ false: '#2A2F3A', true: '#1D4ED8' }}
          thumbColor="#FFFFFF"
          testID="system-toggle"
          accessibilityLabel="Sistem bildirimleri"
        />
      </View>

      {/* Sabah hatırlatıcı saati */}
      <Text style={[styles.sectionHeading, styles.sectionSpacing]}>SABAH HATIRLATICI SAATİ</Text>

      <View style={styles.timePickerRow}>
        {/* Saat */}
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => handleHourChange(-1)}
            accessibilityRole="button"
            accessibilityLabel="Saati azalt"
            testID="hour-decrement"
          >
            <Text style={styles.stepperBtnLabel}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue} testID="hour-display">
            {padTwo(localHour)}
          </Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => handleHourChange(1)}
            accessibilityRole="button"
            accessibilityLabel="Saati artır"
            testID="hour-increment"
          >
            <Text style={styles.stepperBtnLabel}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.timeSeparator}>:</Text>

        {/* Dakika (15 dakika adımı) */}
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => handleMinuteChange(-15)}
            accessibilityRole="button"
            accessibilityLabel="Dakikayı azalt"
            testID="minute-decrement"
          >
            <Text style={styles.stepperBtnLabel}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue} testID="minute-display">
            {padTwo(localMinute)}
          </Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => handleMinuteChange(15)}
            accessibilityRole="button"
            accessibilityLabel="Dakikayı artır"
            testID="minute-increment"
          >
            <Text style={styles.stepperBtnLabel}>+</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.timeHint}>Hatırlatıcı bildirimi bu saatte gönderilir (22:00–08:00 sessiz saat).</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1115',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },
  permBanner: {
    backgroundColor: '#1B2230',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3346',
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  permBannerText: {
    color: '#E4E8EF',
    fontSize: 14,
    lineHeight: 20,
  },
  permButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  permButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeading: {
    color: '#9AA3B2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E232C',
  },
  rowLabel: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    color: '#E4E8EF',
    fontSize: 15,
    fontWeight: '500',
  },
  rowHint: {
    color: '#5A6373',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151922',
  },
  stepperBtnLabel: {
    color: '#E4E8EF',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 24,
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    paddingBottom: 4,
  },
  timeHint: {
    color: '#5A6373',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
  },
});
