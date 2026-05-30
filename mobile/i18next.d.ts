import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('./src/i18n/locales/tr/common.json');
      auth: typeof import('./src/i18n/locales/tr/auth.json');
      davet: typeof import('./src/i18n/locales/tr/davet.json');
      errors: typeof import('./src/i18n/locales/tr/errors.json');
      kvkk: typeof import('./src/i18n/locales/tr/kvkk.json');
      members: typeof import('./src/i18n/locales/tr/members.json');
      notifications: typeof import('./src/i18n/locales/tr/notifications.json');
      profile: typeof import('./src/i18n/locales/tr/profile.json');
    };
  }
}
