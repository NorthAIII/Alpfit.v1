import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../src/i18n/index';

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <Fragment>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </Fragment>
    </I18nextProvider>
  );
}
