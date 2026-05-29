import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'errors';
    resources: {
      sms: typeof import('./locales/tr/sms.json');
      errors: typeof import('./locales/tr/errors.json');
      notifications: typeof import('./locales/tr/notifications.json');
    };
  }
}
