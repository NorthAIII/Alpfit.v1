/**
 * Mobile Sentry + PII scrubber testleri — TASK-1.12 KRİTİK kabul kriteri.
 *
 * Kapsam (backend pii-scrubber.test.ts ile paralel):
 *   Test 1 — beforeSend: kilo/boy/yemek/telefon mock event → çıktıda yok
 *   Test 2 — beforeBreadcrumb: /me/measurements/{id} → /me/measurements/[id],
 *            HTTP body alanı drop
 *   Test 3 — hashUserId: 12-hex deterministic anonimizasyon
 *   Test 4 — initSentry: DSN yoksa false (degrade), DSN varsa Sentry.init çağrılır
 *   Test 5 — Negatif kanıt: serialized event'te ham telefon/üye ID bulunmaz
 *
 * Sentry SDK mock'lanır — gerçek init network/global state açar.
 */

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: <T>(c: T): T => c,
}));

import * as Sentry from '@sentry/react-native';

import {
  hashUserId,
  sanitizeUrl,
  scrubPii,
  sentryBeforeBreadcrumb,
  sentryBeforeSend,
} from './pii-scrubber';
import { initSentry } from './sentry';

import type { Breadcrumb, Event } from '@sentry/react-native';

const mockedSentryInit = Sentry.init as jest.MockedFunction<typeof Sentry.init>;

describe('sentryBeforeSend — KVKK PII scrubbing (mobile)', () => {
  beforeEach(() => {
    mockedSentryInit.mockClear();
  });

  it('removes phone/weight/mealLog from request.data, user, extra', () => {
    const event: Event = {
      request: {
        url: 'https://api.alpfit.app/me/measurements',
        method: 'POST',
        data: {
          phone: '+905551234567',
          weight: 75,
          height: 178,
          mealLog: 'omlet + 2 yumurta',
          calories: 450,
          unrelated: 'ok',
        },
      },
      user: {
        id: 42,
        phone: '+905551234567',
        name: 'Ali Veli',
        email: 'ali@example.com',
      },
      extra: {
        body: { foodLog: 'pilav', weight: 80 },
        traceId: 'mob-abc-123',
      },
    };

    const scrubbed = sentryBeforeSend(event);

    expect(scrubbed.request?.data).toMatchObject({
      phone: '[REDACTED]',
      weight: '[REDACTED]',
      height: '[REDACTED]',
      mealLog: '[REDACTED]',
      calories: '[REDACTED]',
      unrelated: 'ok',
    });

    expect(scrubbed.user?.['phone']).toBe('[REDACTED]');
    expect(scrubbed.user?.['name']).toBe('[REDACTED]');
    expect(scrubbed.user?.email).toBeUndefined();
    expect(scrubbed.user?.id).toBe(hashUserId(42));
    expect(String(scrubbed.user?.id)).not.toBe('42');

    const extra = scrubbed.extra as { body: { foodLog: string; weight: string }; traceId: string };
    expect(extra.body.foodLog).toBe('[REDACTED]');
    expect(extra.body.weight).toBe('[REDACTED]');
    expect(extra.traceId).toBe('mob-abc-123');
  });

  it('handles missing fields gracefully (no body / no user / no extra)', () => {
    const event: Event = { event_id: 'evt-1', message: 'something happened' };
    const scrubbed = sentryBeforeSend(event);
    expect(scrubbed.event_id).toBe('evt-1');
    expect(scrubbed.message).toBe('something happened');
  });

  it('scrubs PII in breadcrumb data', () => {
    const event: Event = {
      breadcrumbs: [
        {
          category: 'http',
          data: { url: '/api/x', phone: '+905557654321', weight: 70 },
        },
      ],
    };
    const scrubbed = sentryBeforeSend(event);
    const data = scrubbed.breadcrumbs?.[0]?.data as Record<string, string>;
    expect(data['phone']).toBe('[REDACTED]');
    expect(data['weight']).toBe('[REDACTED]');
    expect(data['url']).toBe('/api/x');
  });
});

describe('scrubPii — recursive walk', () => {
  it('does not mutate the original object', () => {
    const original = { phone: '+90555', nested: { weight: 80 } };
    const scrubbed = scrubPii(original) as unknown as { phone: string; nested: { weight: string } };
    expect(original.phone).toBe('+90555');
    expect(original.nested.weight).toBe(80);
    expect(scrubbed.phone).toBe('[REDACTED]');
    expect(scrubbed.nested.weight).toBe('[REDACTED]');
  });

  it('survives cyclic references', () => {
    const a: Record<string, unknown> = { phone: '+90555' };
    a['self'] = a;
    expect(() => scrubPii(a)).not.toThrow();
  });
});

describe('hashUserId — anonimizasyon (crypto-js sha256)', () => {
  it('produces 12-char hex prefix of sha256(id)', () => {
    const h = hashUserId(42);
    expect(h).toMatch(/^[0-9a-f]{12}$/);
    expect(h).not.toBe('42');
  });

  it('is deterministic', () => {
    expect(hashUserId('user-123')).toBe(hashUserId('user-123'));
  });

  it('differs for different inputs', () => {
    expect(hashUserId('a')).not.toBe(hashUserId('b'));
  });

  it('matches Node sha256 algorithm (cross-platform parity)', () => {
    // sha256("42") = 73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049
    // ilk 12 char: 73475cb40a56
    expect(hashUserId(42)).toBe('73475cb40a56');
  });
});

describe('sanitizeUrl — KVKK hassas path generic-leştirme', () => {
  it('replaces member id segments in known sensitive prefixes', () => {
    expect(sanitizeUrl('/me/measurements/123')).toBe('/me/measurements/[id]');
    expect(sanitizeUrl('/me/food-log/abc-def-456')).toBe('/me/food-log/[id]');
    expect(sanitizeUrl('/pt/members/789/notes')).toBe('/pt/members/[id]/notes');
  });

  it('replaces UUID segments anywhere defensively', () => {
    expect(sanitizeUrl('/api/x/550e8400-e29b-41d4-a716-446655440000/y')).toBe('/api/x/[id]/y');
  });

  it('replaces numeric id segments anywhere defensively', () => {
    expect(sanitizeUrl('/api/foo/12345/bar')).toBe('/api/foo/[id]/bar');
  });

  it('leaves non-id paths untouched', () => {
    expect(sanitizeUrl('/healthz')).toBe('/healthz');
    expect(sanitizeUrl('/api/version')).toBe('/api/version');
  });
});

describe('sentryBeforeBreadcrumb — URL sanitize + HTTP body drop', () => {
  it('sanitizes url + drops body in fetch breadcrumb', () => {
    const breadcrumb: Breadcrumb = {
      category: 'fetch',
      data: {
        url: 'https://api.alpfit.app/me/measurements/42',
        method: 'POST',
        request_body: { weight: 75, phone: '+905551234567' },
        response_body: { id: 42 },
        status_code: 200,
      },
    };
    const out = sentryBeforeBreadcrumb(breadcrumb);
    expect(out).not.toBeNull();
    const data = out?.data as Record<string, unknown>;
    expect(data['url']).toBe('https://api.alpfit.app/me/measurements/[id]');
    expect(data['request_body']).toBeUndefined();
    expect(data['response_body']).toBeUndefined();
    expect(data['status_code']).toBe(200);
  });

  it('sanitizes navigation breadcrumb to/from', () => {
    const breadcrumb: Breadcrumb = {
      category: 'navigation',
      data: { from: '/home', to: '/me/measurements/99' },
    };
    const out = sentryBeforeBreadcrumb(breadcrumb);
    const data = out?.data as Record<string, string>;
    expect(data['from']).toBe('/home');
    expect(data['to']).toBe('/me/measurements/[id]');
  });

  it('scrubs PII in breadcrumb data via shared scrubber', () => {
    const breadcrumb: Breadcrumb = {
      category: 'ui.click',
      data: { phone: '+905557654321', target: 'submit-btn' },
    };
    const out = sentryBeforeBreadcrumb(breadcrumb);
    const data = out?.data as Record<string, string>;
    expect(data['phone']).toBe('[REDACTED]');
    expect(data['target']).toBe('submit-btn');
  });
});

describe('initSentry — degrade mode + init call', () => {
  beforeEach(() => {
    mockedSentryInit.mockClear();
  });

  it('returns false and skips init when DSN missing', () => {
    const ok = initSentry({ environment: 'development' });
    expect(ok).toBe(false);
    expect(mockedSentryInit).not.toHaveBeenCalled();
  });

  it('warns when DSN missing in production environment', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ok = initSentry({ environment: 'production' });
    expect(ok).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('EXPO_PUBLIC_SENTRY_DSN'));
    warnSpy.mockRestore();
  });

  it('calls Sentry.init with PII-safe options when DSN provided', () => {
    const ok = initSentry({
      dsn: 'https://abc@o0.ingest.de.sentry.io/0',
      environment: 'staging',
    });
    expect(ok).toBe(true);
    expect(mockedSentryInit).toHaveBeenCalledTimes(1);
    const callArg = mockedSentryInit.mock.calls[0]?.[0];
    expect(callArg).toMatchObject({
      dsn: 'https://abc@o0.ingest.de.sentry.io/0',
      environment: 'staging',
      sendDefaultPii: false,
      tracesSampleRate: 1.0,
    });
    expect(typeof callArg?.beforeSend).toBe('function');
    expect(typeof callArg?.beforeBreadcrumb).toBe('function');
  });

  it('uses 0.1 traces rate in production', () => {
    initSentry({ dsn: 'https://x@o0.ingest.de.sentry.io/0', environment: 'production' });
    const callArg = mockedSentryInit.mock.calls[0]?.[0];
    expect(callArg?.tracesSampleRate).toBe(0.1);
  });
});

describe('Negative: serialized event contains no raw PII', () => {
  it('event.user.id is hashed; phone removed from request.data', () => {
    const event: Event = {
      request: { data: { phone: '+905551112222', weight: 70 } },
      user: { id: 'raw-user-id-99', phone: '+905551112222' },
    };
    const out = sentryBeforeSend(event);

    expect(out.user?.id).toBe(hashUserId('raw-user-id-99'));
    expect(out.user?.id).not.toBe('raw-user-id-99');
    expect(out.user?.['phone']).toBe('[REDACTED]');

    const data = out.request?.data as Record<string, string>;
    expect(data['phone']).toBe('[REDACTED]');
    expect(data['weight']).toBe('[REDACTED]');

    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain('+905551112222');
    expect(serialized).not.toContain('raw-user-id-99');
  });
});
