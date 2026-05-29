/**
 * Sentry init — backend hata izleme + KVKK PII koruması.
 *
 * Region: EU Frankfurt residency. DSN'in `o<orgId>.ingest.de.sentry.io` host'una
 * sahip olması gerekir (Sentry Cloud EU). KVKK m.9 reformu sonrası AB veri
 * konumu argümanı + Standart Sözleşme (SCC, KVKK.md TODO) ile savunulur.
 *
 * Davranış:
 * - `SENTRY_DSN` env yoksa Sentry init **atlanır**, app çalışmaya devam eder
 *   (degrade mode). Production'da DSN eksikse warning log'a düşer; hata fırlatılmaz.
 * - `sendDefaultPii: false` — Sentry'nin default user IP / headers / cookies
 *   gönderme davranışı kapatılır (KVKK savunma katmanı #1).
 * - `beforeSend: sentryBeforeSend` — her event PII scrubber'dan geçer (katman #2).
 * - `tracesSampleRate`: production'da 0.1 (free plan 5K event quota koruması);
 *   staging/dev'de 1.0.
 *
 * Test: `pii-scrubber.test.ts` `sentryBeforeSend`'i izole test eder; gerçek SDK
 * init'i unit test'te çağrılmaz (network/global state riski).
 */

import * as Sentry from '@sentry/node';

import { sentryBeforeSend } from './pii-scrubber.js';

import type { Env } from '../config/env.js';

export interface SentryInitOptions {
  env: Env;
  dsn?: string | undefined;
  release?: string | undefined;
}

export function initSentry(opts: SentryInitOptions): boolean {
  const dsn = opts.dsn ?? process.env['SENTRY_DSN'];

  if (!dsn) {
    if (opts.env.NODE_ENV === 'production' || opts.env.NODE_ENV === 'staging') {
      process.stderr.write(
        '[sentry] SENTRY_DSN not set in non-development environment — error tracking disabled.\n',
      );
    }
    return false;
  }

  Sentry.init({
    dsn,
    environment: opts.env.APP_ENV,
    release: opts.release ?? process.env['SENTRY_RELEASE'],
    sendDefaultPii: false,
    tracesSampleRate: opts.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend: (event) => sentryBeforeSend(event),
  });

  return true;
}
