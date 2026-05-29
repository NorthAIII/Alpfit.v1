/**
 * KVKK PII scrubber — Sentry React Native beforeSend + breadcrumb policy.
 *
 * Mobile yan-katmanı backend pii-scrubber ile aynı kontratı uygular
 * (`shared/src/pii-fields.ts` SSOT). 3 katmanlı KVKK savunmasının mobile yansıması:
 *   (a) Sentry SDK `sendDefaultPii: false`         — sentry.ts
 *   (b) Bu scrubber `beforeSend` ile event PII alanlarını siler (recursive)
 *   (c) `beforeBreadcrumb` ile navigation/HTTP URL'lerindeki üye ID'lerini
 *       generic placeholder ile değiştirir, body içeriklerini drop eder
 *
 * User ID hash'lenir (sha256 prefix 12) — geri çevrilemez anonimizasyon.
 * Ham hiçbir PII Sentry'ye gitmez.
 *
 * Backend ile farkı: Node `crypto` yok; sync sha256 için `crypto-js` kullanılır.
 */

import { PII_FIELDS } from '@alpfit/shared';
import Hex from 'crypto-js/enc-hex';
import sha256 from 'crypto-js/sha256';

import type { Breadcrumb, Event } from '@sentry/react-native';

// `@sentry/react-native` `BreadcrumbHint`'i re-export etmiyor; `@sentry/core`'a
// transitive dep eklemek yerine hint'i hafifçe yapısal olarak typeluyoruz.
// İçeriği kullanmıyoruz, yalnızca beforeBreadcrumb imzasını birebir tutmak için var.
type BreadcrumbHint = Record<string, unknown>;

const REDACTED_MARKER = '[REDACTED]';
const PII_FIELD_SET = new Set<string>(PII_FIELDS);

/**
 * Üye ID'sini geri çevrilemez şekilde anonimleştirir: sha256(id) hex'inin ilk
 * 12 karakteri. Sentry'de grouping için yeterli (1e14 entropi); KVKK denetimi
 * açısından "ham üye kimliği Sentry'ye gitmiyor" beyanı için kanıt.
 */
export function hashUserId(rawId: string | number): string {
  return Hex.stringify(sha256(String(rawId))).slice(0, 12);
}

/**
 * Bir değerdeki PII alanlarını recursive olarak `[REDACTED]` ile değiştirir.
 * Orijinal mutate edilmez. Döngüsel referansları WeakSet ile yutar.
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
 * Sentry RN `beforeSend` hook'u. Event Sentry'ye gitmeden önce PII alanlarını siler.
 *
 * Scrub edilen alanlar (backend ile birebir):
 *   1. `event.request.data` — HTTP body
 *   2. `event.request.cookies`, `event.request.query_string`, `event.request.headers`
 *   3. `event.user` — id hash'lenir, email/username/ip_address silinir, kalanı scrub
 *   4. `event.extra`, `event.contexts`
 *   5. `event.breadcrumbs[].data`
 *
 * Event tamamen drop edilmez — exception type, stack, message korunur (debug).
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

/**
 * URL path'inde KVKK riskli üye ID segment'lerini generic placeholder ile değiştirir.
 *
 * Örnek: `/me/measurements/123` → `/me/measurements/[id]`
 *
 * Bilinen riskli prefix'ler — Yakın 3-4 endpoint'leri (ölçüm, yemek günlüğü, üye detay).
 * Bu fazda endpoint'ler henüz yok, ama transformer ileri-uyumlu hazırlanır:
 * yeni hassas path eklendiğinde liste güncellenir (memory KVKK matrisi disiplini).
 *
 * Genel sayısal/UUID segment'leri de defansif olarak generic'leştirilir — log'da
 * "uuid in path" sızıntısı.
 */
const SENSITIVE_PATH_PATTERNS: Array<{ prefix: string }> = [
  { prefix: '/me/measurements' },
  { prefix: '/me/food-log' },
  { prefix: '/me/notes' },
  { prefix: '/pt/members' },
  { prefix: '/members' },
  { prefix: '/measurements' },
  { prefix: '/food-log' },
  { prefix: '/invites' },
];

// Her alternatif yol-sınırına (`/`, `?`, `#` veya string sonu) hizalı olmak
// zorunda — aksi halde UUID gibi karışık segment'lerde `\d+` baştan kısmi
// match yapıp UUID'nin ilk hex chunk'ını yer (örn. `/api/x/550e8400-...-y`
// → `/api/x/[id]e8400-...-y`). Lookahead ile her alternatifin tam segment'i
// kapsamasını zorunlu kılıyoruz.
const ID_SEGMENT_REGEX =
  /\/(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9]{16,})(?=[/?#]|$)/gi;

export function sanitizeUrl(rawUrl: string): string {
  let working = rawUrl;
  for (const { prefix } of SENSITIVE_PATH_PATTERNS) {
    if (working.includes(prefix)) {
      working = working.replace(new RegExp(`(${prefix})/[^/?#]+`, 'g'), `$1/[id]`);
    }
  }
  working = working.replace(ID_SEGMENT_REGEX, '/[id]');
  return working;
}

/**
 * Sentry RN `beforeBreadcrumb` hook'u.
 *
 * Policy:
 *  - HTTP/fetch/xhr breadcrumb'larında URL path'i `sanitizeUrl` ile generic'leştirilir.
 *  - HTTP body (request/response payload) **drop** edilir — `data.request_body_size` /
 *    `data.response_body_size` gibi metrikler korunur; ham içerik (body) tutulmaz.
 *  - Navigation breadcrumb'ında `to`/`from` URL'leri sanitize edilir.
 *  - Tüm `data` objesi yine `scrubPii` ile recursive PII scrub'tan geçer.
 */
export function sentryBeforeBreadcrumb(
  breadcrumb: Breadcrumb,
  _hint?: BreadcrumbHint,
): Breadcrumb | null {
  const out: Breadcrumb = { ...breadcrumb };

  if (out.data) {
    const data: Record<string, unknown> = { ...(out.data as Record<string, unknown>) };

    if (typeof data['url'] === 'string') {
      data['url'] = sanitizeUrl(data['url']);
    }
    if (typeof data['to'] === 'string') {
      data['to'] = sanitizeUrl(data['to']);
    }
    if (typeof data['from'] === 'string') {
      data['from'] = sanitizeUrl(data['from']);
    }

    if (out.category === 'fetch' || out.category === 'xhr' || out.category === 'http') {
      delete data['request_body'];
      delete data['response_body'];
      delete data['body'];
    }

    out.data = scrubPii(data) as typeof out.data;
  }

  if (typeof out.message === 'string') {
    out.message = sanitizeUrl(out.message);
  }

  return out;
}
