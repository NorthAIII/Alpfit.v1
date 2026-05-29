/**
 * KVKK PII scrubber testleri — TASK-1.11 KRİTİK kabul kriteri.
 *
 * Kapsam:
 *   Test 1 — Sentry beforeSend: kilo/boy/yemek/telefon içeren mock event
 *            scrubber'dan geçince **bu alanlar yok** (REDACTED veya undefined).
 *   Test 2 — pino redact: logger.info({phone, weight, mealLog, password, ...})
 *            stdout capture'da bu alanlar `[REDACTED]`.
 *   Test 3 — Negative: hash'li `event.user.id` formatta var ama ham `phone` yok.
 *
 * Sentry SDK gerçekten init edilmez (network/global state riski) — scrubber
 * doğrudan fonksiyon olarak çağrılır.
 */

import { getPinoRedactPaths } from '@alpfit/shared';
import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { hashUserId, scrubPii, sentryBeforeSend } from './pii-scrubber.js';

import type { Event } from '@sentry/node';

describe('sentryBeforeSend — KVKK PII scrubbing', () => {
  it('removes phone, weight, mealLog from request.data, user, extra', () => {
    const event: Event = {
      request: {
        url: 'https://alpfit.app/api/measurements',
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
        traceId: 'abc-123',
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
    expect(extra.traceId).toBe('abc-123');
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
    const scrubbed = scrubPii(original) as { phone: string; nested: { weight: string } };
    expect(original.phone).toBe('+90555');
    expect(original.nested.weight).toBe(80);
    expect(scrubbed.phone).toBe('[REDACTED]');
    expect(scrubbed.nested.weight).toBe('[REDACTED]');
  });

  it('handles arrays', () => {
    const input = { measurements: [{ weight: 80 }, { weight: 82 }] };
    const out = scrubPii(input) as { measurements: string };
    // `measurements` is in PII_FIELDS, so the whole array becomes REDACTED
    expect(out.measurements).toBe('[REDACTED]');
  });

  it('survives cyclic references', () => {
    const a: Record<string, unknown> = { phone: '+90555' };
    a['self'] = a;
    expect(() => scrubPii(a)).not.toThrow();
  });
});

describe('hashUserId — anonimizasyon', () => {
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
});

describe('pino redact — KVKK log koruması', () => {
  it('redacts PII fields from log JSON', () => {
    const chunks: string[] = [];
    const dest = {
      write: (s: string): boolean => {
        chunks.push(s);
        return true;
      },
    };

    const logger = pino(
      {
        level: 'info',
        redact: { paths: getPinoRedactPaths(), censor: '[REDACTED]' },
      },
      dest,
    );

    logger.info(
      {
        phone: '+905551234567',
        weight: 75,
        mealLog: 'omlet',
        password: 'super-secret',
        traceId: 'kept-123',
        nested: { phone: '+905557654321', email: 'leaked@example.com' },
      },
      'measurement saved',
    );

    const line = chunks.join('');
    expect(line).toContain('"phone":"[REDACTED]"');
    expect(line).toContain('"weight":"[REDACTED]"');
    expect(line).toContain('"mealLog":"[REDACTED]"');
    expect(line).toContain('"password":"[REDACTED]"');
    expect(line).toContain('"email":"[REDACTED]"');
    expect(line).toContain('"traceId":"kept-123"');
    expect(line).toContain('"msg":"measurement saved"');
    expect(line).not.toContain('+905551234567');
    expect(line).not.toContain('+905557654321');
    expect(line).not.toContain('leaked@example.com');
    expect(line).not.toContain('super-secret');
    expect(line).not.toContain('omlet');
  });
});

describe('Negative: scrubbed user.id is hash, raw phone removed', () => {
  it('event.user.id is hashed (not raw); phone removed from request.data', () => {
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
