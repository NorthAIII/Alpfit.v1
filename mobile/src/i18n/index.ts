import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import authTr from './locales/tr/auth.json';
import commonTr from './locales/tr/common.json';
import davetTr from './locales/tr/davet.json';
import errorsTr from './locales/tr/errors.json';
import kvkkTr from './locales/tr/kvkk.json';
import membersTr from './locales/tr/members.json';
import notificationsTr from './locales/tr/notifications.json';
import profileTr from './locales/tr/profile.json';
import settingsTr from './locales/tr/settings.json';

const isDev = process.env['NODE_ENV'] !== 'production';

export const defaultNS = 'common' as const;
export const namespaces = [
  'common',
  'auth',
  'davet',
  'errors',
  'kvkk',
  'members',
  'notifications',
  'profile',
  'settings',
] as const;
export type Namespace = (typeof namespaces)[number];

const resources = {
  tr: {
    common: commonTr,
    auth: authTr,
    davet: davetTr,
    errors: errorsTr,
    kvkk: kvkkTr,
    members: membersTr,
    notifications: notificationsTr,
    profile: profileTr,
    settings: settingsTr,
  },
} as const;

function detectInitialLocale(): 'tr' {
  void getLocales();
  return 'tr';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLocale(),
  fallbackLng: 'tr',
  supportedLngs: ['tr'],
  defaultNS,
  ns: [...namespaces],
  interpolation: { escapeValue: false },
  returnNull: false,
  saveMissing: isDev,
  missingKeyHandler: (lngs, ns, key) => {
    const msg = `[i18n] missing key "${ns}:${String(key)}" for ${lngs.join(',')}`;
    if (isDev) {
      throw new Error(msg);
    }
    console.warn(msg);
  },
  react: { useSuspense: false },
});

export default i18n;
