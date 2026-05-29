/**
 * Sentry RN init — mobile crash reporting + KVKK PII koruması.
 *
 * Region: EU Frankfurt residency. DSN `o<orgId>.ingest.de.sentry.io` host'una
 * sahip olmalı. PII koruması üç katmanlı:
 *   (a) `sendDefaultPii: false` — SDK varsayılan user IP/headers/cookies kapalı
 *   (b) `beforeSend: sentryBeforeSend` — event PII scrub (request/user/extra/breadcrumbs)
 *   (c) `beforeBreadcrumb: sentryBeforeBreadcrumb` — URL sanitize + HTTP body drop
 *
 * Davranış:
 *  - `EXPO_PUBLIC_SENTRY_DSN` yoksa init **atlanır**, app çalışmaya devam eder
 *    (degrade mode). Production/staging'de DSN eksikse console.warn düşer; throw yok.
 *  - `tracesSampleRate`: production'da 0.1, dev/staging'de 1.0.
 *  - Source map upload Yakın 5'te (EAS Build pipeline) aktive — bu fazda yapı kurulu
 *    ama runtime'da source map'siz minified stack kabul edilir.
 *
 * Test: `sentry.test.ts` `@sentry/react-native` mock'lar ve `initSentry()`'in
 *       degrade/init kararlarını kontrol eder. Gerçek SDK init network/global state
 *       açar — unit test'te çalıştırılmaz.
 */

import * as Sentry from '@sentry/react-native';

import { sentryBeforeBreadcrumb, sentryBeforeSend } from './pii-scrubber';

export type SentryEnvironment = 'development' | 'staging' | 'production' | 'test';

export interface SentryInitOptions {
  dsn?: string | undefined;
  environment: SentryEnvironment;
  release?: string | undefined;
}

/**
 * Sentry'yi init eder. DSN yoksa false döner (degrade mode) — app boot devam eder.
 *
 * @returns Sentry aktif edildi mi
 */
export function initSentry(opts: SentryInitOptions): boolean {
  const dsn = opts.dsn ?? '';

  if (!dsn) {
    if (opts.environment === 'production' || opts.environment === 'staging') {
      console.warn(
        '[sentry] EXPO_PUBLIC_SENTRY_DSN not set in non-development environment — crash reporting disabled.',
      );
    }
    return false;
  }

  Sentry.init({
    dsn,
    environment: opts.environment,
    release: opts.release,
    sendDefaultPii: false,
    tracesSampleRate: opts.environment === 'production' ? 0.1 : 1.0,
    beforeSend: (event) => sentryBeforeSend(event),
    beforeBreadcrumb: (breadcrumb, hint) => sentryBeforeBreadcrumb(breadcrumb, hint),
    enableAutoSessionTracking: true,
  });

  return true;
}

/**
 * `EXPO_PUBLIC_*` env değişkenlerinden Sentry init parametrelerini okur.
 * Module-level çağrı: `mobile/app/_layout.tsx` boot anında çalışır.
 */
export function initSentryFromEnv(): boolean {
  const dsn = process.env['EXPO_PUBLIC_SENTRY_DSN'];
  const envRaw = process.env['EXPO_PUBLIC_APP_ENV'] ?? process.env['NODE_ENV'] ?? 'development';
  const environment: SentryEnvironment = isSentryEnvironment(envRaw) ? envRaw : 'development';
  const release = process.env['EXPO_PUBLIC_SENTRY_RELEASE'];

  return initSentry({ dsn, environment, release });
}

function isSentryEnvironment(value: string): value is SentryEnvironment {
  return (
    value === 'development' || value === 'staging' || value === 'production' || value === 'test'
  );
}

export { Sentry };
