import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import i18next, { type i18n as I18nInstance } from 'i18next';

const localeDir = join(dirname(fileURLToPath(import.meta.url)), 'locales', 'tr');

function loadNamespace<T extends Record<string, unknown>>(name: string): T {
  const raw = readFileSync(join(localeDir, `${name}.json`), 'utf-8');
  return JSON.parse(raw) as T;
}

export const defaultNS = 'errors' as const;
export const namespaces = ['sms', 'errors', 'notifications'] as const;
export type Namespace = (typeof namespaces)[number];

const isDev = process.env['NODE_ENV'] !== 'production';

const instance: I18nInstance = i18next.createInstance();

void instance.init({
  lng: 'tr',
  fallbackLng: 'tr',
  supportedLngs: ['tr'],
  defaultNS,
  ns: [...namespaces],
  resources: {
    tr: {
      sms: loadNamespace('sms'),
      errors: loadNamespace('errors'),
      notifications: loadNamespace('notifications'),
    },
  },
  interpolation: { escapeValue: false },
  returnNull: false,
  saveMissing: isDev,
  missingKeyHandler: (lngs, ns, key) => {
    const msg = `[i18n] missing key "${ns}:${String(key)}" for ${lngs.join(',')}`;
    if (isDev) {
      throw new Error(msg);
    }
  },
});

export const i18n = instance;
export const t: I18nInstance['t'] = instance.t.bind(instance) as I18nInstance['t'];
export default instance;
