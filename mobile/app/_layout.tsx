import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../src/i18n/index';
import { Sentry, initSentryFromEnv } from '../src/observability/sentry';

// Module-level init: React render başlamadan önce Sentry hazır olur, böylece
// boot-time hatalar da yakalanır. DSN yoksa no-op (degrade mode).
initSentryFromEnv();

function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <Fragment>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </Fragment>
    </I18nextProvider>
  );
}

// Sentry.wrap, init edilmemişse de güvenli (no-op error boundary).
export default Sentry.wrap(RootLayout);
