import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { bootstrapSession, homePathForRole } from '../src/auth/auth-actions';
import i18n from '../src/i18n/index';
import { asyncStoragePersister, queryClient } from '../src/lib/queryClient';
import { Sentry, initSentryFromEnv } from '../src/observability/sentry';

// Module-level init: React render başlamadan önce Sentry hazır olur, böylece
// boot-time hatalar da yakalanır. DSN yoksa no-op (degrade mode).
initSentryFromEnv();

// Açılış "splash" örtüsü (TASK-1.33). Auto-login akışı (refresh → /auth/me)
// çözülene kadar landing'in görünmesini engeller; bitince kaldırılır.
function BootSplash() {
  const { t } = useTranslation('common');
  return (
    <View style={styles.splash}>
      <Text style={styles.logo}>{t('app.name')}</Text>
      <ActivityIndicator color="#3B82F6" />
      <Text style={styles.loading}>{t('states.loading')}</Text>
    </View>
  );
}

function RootLayout() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);

  // App açılışta oturumu geri yüklemeye çalış (30 gün cihaz hatırlama). Saklı
  // refresh token geçerliyse role göre ana ekrana yönlendir; değilse örtü
  // kaldırılır ve landing (index) görünür.
  useEffect(() => {
    let active = true;
    void bootstrapSession().then((result) => {
      if (!active) {
        return;
      }
      if (result.kind === 'authenticated') {
        router.replace(homePathForRole(result.role));
      }
      setBooting(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <I18nextProvider i18n={i18n}>
        <Fragment>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
          {booting ? <BootSplash /> : null}
        </Fragment>
      </I18nextProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F1115',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loading: {
    color: '#9AA3B2',
    fontSize: 14,
  },
});

// Sentry.wrap, init edilmemişse de güvenli (no-op error boundary).
export default Sentry.wrap(RootLayout);
