/**
 * KVKK PII scrubber — Sentry beforeSend + util'leri.
 *
 * 3 katmanlı KVKK savunmasının ikinci katmanı:
 *   (a) Sentry SDK `sendDefaultPii: false`        — default kapanır (sentry.ts)
 *   (b) Bu scrubber `beforeSend` ile event'ten PII alanlarını siler (recursive)
 *   (c) pino fast-redact stdout log'larından PII alanlarını [REDACTED] yapar (server.ts)
 *
 * Üçü birlikte savunma derinliği sağlar — biri bypass edilse diğeri yakalar.
 *
 * Tasarım kararları:
 * - User ID **hash**'lenir (sha256 prefix 12 char) — anonimizasyon yeterli,
 *   secret rotate gerekmez. Ham user_id Sentry'ye gitmez.
 * - `event.request.data` (HTTP body), `event.user`, `event.extra`, `event.contexts`,
 *   `event.breadcrumbs[].data` derin yürütülür — PII alanları silinir.
 * - PII alan listesi `@alpfit/shared/pii-fields` (SSOT). Yeni alan eklendiğinde
 *   orada güncellenir; burada hiçbir liste tutulmaz.
 */

import { createHash } from 'node:crypto';

import { PII_FIELDS } from '@alpfit/shared';

import type { Event } from '@sentry/node';

const REDACTED_MARKER = '[REDACTED]';
const PII_FIELD_SET = new Set<string>(PII_FIELDS);

/**
 * User ID'yi anonimleştirir: sha256(id) hex'inin ilk 12 karakteri.
 *
 * Sentry'de event'leri kullanıcıya göre gruplamak için yeterli (1e14 entropi);
 * geri çevrilemez. KVKK denetimi açısından "ham veri Sentry'ye gitmiyor" beyanı
 * için kanıt: bu fonksiyonun çıktısı + PII_FIELDS scrub matrisi.
 */
export function hashUserId(rawId: string | number): string {
  return createHash('sha256').update(String(rawId)).digest('hex').slice(0, 12);
}

/**
 * Bir objedeki PII alanlarını recursive olarak `[REDACTED]` ile değiştirir.
 * Orijinal objeyi mutate etmez — yeni obje döndürür.
 *
 * Array'leri sırayla yürür; ilkel değerler (string/number/boolean/null) olduğu gibi
 * geçer. Döngüsel referans güvenliği için WeakSet ile ziyaret takip edilir.
 */
export function scrubPii<T>(value: T): T {
  return scrubPiiInternal(value, new WeakSet()) as T;
}

function scrubPiiInternal(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (seen.has(value as object)) return value;
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => scrubPiiInternal(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (PII_FIELD_SET.has(key)) {
      out[key] = REDACTED_MARKER;
    } else {
      out[key] = scrubPiiInternal(val, seen);
    }
  }
  return out;
}

/**
 * Sentry `beforeSend` hook'u. Event Sentry'ye gitmeden önce PII alanlarını siler.
 *
 * Scrub edilen alanlar:
 *   1. `event.request.data` — HTTP body (Fastify request body)
 *   2. `event.request.cookies`, `event.request.query_string` — yan kanallar
 *   3. `event.user` — Sentry user context (name/email/username temizlenir, id hash'lenir)
 *   4. `event.extra`, `event.contexts` — manuel veya integration tarafından eklenen
 *   5. `event.breadcrumbs[].data` — breadcrumb payload'ları
 *
 * Event tamamen drop edilmez — sadece içindeki PII silinir. Hata trace'i,
 * exception type, stack frame yolları korunur (debug edilebilirlik).
 */
export function sentryBeforeSend<E extends Event>(event: E): E {
  if (event.request) {
    const req = event.request;
    if (req.data !== undefined) {
      req.data = scrubPii(req.data);
    }
    if (req.cookies !== undefined) {
      req.cookies = scrubPii(req.cookies) as typeof req.cookies;
    }
    if (req.query_string !== undefined && typeof req.query_string !== 'string') {
      req.query_string = scrubPii(req.query_string) as typeof req.query_string;
    }
    if (req.headers) {
      req.headers = scrubPii(req.headers) as typeof req.headers;
    }
  }

  if (event.user) {
    const { id, ...rest } = event.user;
    const scrubbed = scrubPii(rest) as Record<string, unknown>;
    if (id !== undefined && id !== null) {
      scrubbed['id'] = hashUserId(id as string | number);
    }
    // ham email/username/ip silinir
    delete scrubbed['email'];
    delete scrubbed['username'];
    delete scrubbed['ip_address'];
    event.user = scrubbed;
  }

  if (event.extra) {
    event.extra = scrubPii(event.extra) as typeof event.extra;
  }

  if (event.contexts) {
    event.contexts = scrubPii(event.contexts) as typeof event.contexts;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (b.data) {
        return { ...b, data: scrubPii(b.data) as typeof b.data };
      }
      return b;
    });
  }

  return event;
}
