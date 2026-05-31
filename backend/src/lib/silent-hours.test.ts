/**
 * TASK-3.04 — isInSilentHours + msUntilTomorrowMorning unit testleri.
 *
 * Europe/Istanbul = UTC+3 (2016'dan beri DST yok).
 * vi.setSystemTime ile UTC saati pin'lenir; fonksiyonlar Istanbul saatini
 * toLocaleString('sv-SE', { timeZone: 'Europe/Istanbul' }) ile hesaplar.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isInSilentHours, msUntilTomorrowMorning } from './silent-hours.js';

describe('isInSilentHours', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('22:01 Istanbul → true (sessiz saat açık)', () => {
    // 22:01 Istanbul = 19:01 UTC
    vi.setSystemTime(new Date('2024-01-15T19:01:00.000Z'));
    expect(isInSilentHours()).toBe(true);
  });

  it('08:30 Istanbul → false (gündüz saati)', () => {
    // 08:30 Istanbul = 05:30 UTC
    vi.setSystemTime(new Date('2024-01-15T05:30:00.000Z'));
    expect(isInSilentHours()).toBe(false);
  });

  it('00:30 Istanbul → true (gece yarısı sessiz)', () => {
    // 00:30 Istanbul = 21:30 önceki gün UTC
    vi.setSystemTime(new Date('2024-01-14T21:30:00.000Z'));
    expect(isInSilentHours()).toBe(true);
  });

  it('07:59 Istanbul → true (sessiz saat henüz bitmedi)', () => {
    // 07:59 Istanbul = 04:59 UTC
    vi.setSystemTime(new Date('2024-01-15T04:59:00.000Z'));
    expect(isInSilentHours()).toBe(true);
  });

  it('08:00 Istanbul → false (sessiz saat tam bitiş)', () => {
    // 08:00 Istanbul = 05:00 UTC
    vi.setSystemTime(new Date('2024-01-15T05:00:00.000Z'));
    expect(isInSilentHours()).toBe(false);
  });

  it('21:59 Istanbul → false (sessiz saat henüz başlamadı)', () => {
    // 21:59 Istanbul = 18:59 UTC
    vi.setSystemTime(new Date('2024-01-15T18:59:00.000Z'));
    expect(isInSilentHours()).toBe(false);
  });
});

describe('msUntilTomorrowMorning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pozitif ms döner', () => {
    // Şu an 10:00 Istanbul (07:00 UTC)
    vi.setSystemTime(new Date('2024-01-15T07:00:00.000Z'));
    const ms = msUntilTomorrowMorning(9);
    expect(ms).toBeGreaterThan(0);
  });

  it('ertesi gün 09:00 Istanbul\'a yaklaşık doğru delay', () => {
    // Şu an 10:00 Istanbul (07:00 UTC) → ertesi 09:00 = ~23 saat
    vi.setSystemTime(new Date('2024-01-15T07:00:00.000Z'));
    const ms = msUntilTomorrowMorning(9);
    const expectedMs = 23 * 60 * 60 * 1000; // ~23 saat
    // ±30 dakika tolerans
    expect(ms).toBeGreaterThan(expectedMs - 30 * 60 * 1000);
    expect(ms).toBeLessThan(expectedMs + 30 * 60 * 1000);
  });

  it('gece yarısından hemen sonra da pozitif döner', () => {
    // 00:05 Istanbul (21:05 UTC önceki gün) → ertesi gün 09:00 ≈ ~33 saat
    // "ertesi gün" = next calendar day (M4 spec: "ertesi gün 09:00'da atılır")
    vi.setSystemTime(new Date('2024-01-14T21:05:00.000Z'));
    const ms = msUntilTomorrowMorning(9);
    expect(ms).toBeGreaterThan(0);
    // ertesi gün 09:00 Istanbul = 2024-01-15T06:00:00Z → ~33 saat
    const expectedMs = 33 * 60 * 60 * 1000;
    expect(ms).toBeGreaterThan(expectedMs - 30 * 60 * 1000);
    expect(ms).toBeLessThan(expectedMs + 30 * 60 * 1000);
  });
});
