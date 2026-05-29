import { describe, expect, it } from 'vitest';

import {
  formatTrDate,
  formatTrDateShort,
  formatTrDateTime,
  formatTrTime,
  TR_TIMEZONE,
} from './date.js';

describe('formatTrDate', () => {
  it('29 Mayıs 2026 (öğle UTC → TR saatiyle aynı gün)', () => {
    const d = new Date('2026-05-29T12:00:00Z');
    expect(formatTrDate(d)).toBe('29 Mayıs 2026');
  });

  it('Türkçe ay adı uzun haliyle (Ocak)', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    expect(formatTrDate(d)).toBe('15 Ocak 2026');
  });

  it('Türkçe ay adı (Aralık)', () => {
    const d = new Date('2026-12-31T12:00:00Z');
    expect(formatTrDate(d)).toBe('31 Aralık 2026');
  });
});

describe('formatTrDateShort', () => {
  it('29 May 2026 (kısa ay)', () => {
    const d = new Date('2026-05-29T12:00:00Z');
    expect(formatTrDateShort(d)).toBe('29 May 2026');
  });

  it('Ocak kısa hali Oca', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    expect(formatTrDateShort(d)).toBe('15 Oca 2026');
  });
});

describe('formatTrTime', () => {
  it('TR saatine göre 14:30 (UTC 11:30 → TR 14:30 yazın UTC+3)', () => {
    const d = new Date('2026-05-29T11:30:00Z');
    expect(formatTrTime(d)).toBe('14:30');
  });

  it('gece yarısı sınırı 00:00', () => {
    const d = new Date('2026-05-29T21:00:00Z');
    expect(formatTrTime(d)).toBe('00:00');
  });
});

describe('formatTrDateTime', () => {
  it('29 Mayıs 2026, 14:30 (yazın UTC+3)', () => {
    const d = new Date('2026-05-29T11:30:00Z');
    expect(formatTrDateTime(d)).toBe('29 Mayıs 2026, 14:30');
  });

  it('gece yarısı sonrasında tarih ilerler (TR 00:30 → 30 Mayıs)', () => {
    const d = new Date('2026-05-29T21:30:00Z');
    expect(formatTrDateTime(d)).toBe('30 Mayıs 2026, 00:30');
  });
});

describe("Europe/Istanbul timezone — UTC+3 sabit (Türkiye 2016'dan beri DST kullanmıyor)", () => {
  it('Mart sonu (Avrupa DST başlangıcı) TR sabit UTC+3 kalır', () => {
    const beforeDst = new Date('2026-03-28T22:30:00Z');
    expect(formatTrDateTime(beforeDst)).toBe('29 Mart 2026, 01:30');
    const afterDst = new Date('2026-03-29T22:30:00Z');
    expect(formatTrDateTime(afterDst)).toBe('30 Mart 2026, 01:30');
  });

  it('Ekim sonu (Avrupa DST bitişi) TR sabit UTC+3 kalır', () => {
    const beforeEnd = new Date('2026-10-24T22:30:00Z');
    expect(formatTrDateTime(beforeEnd)).toBe('25 Ekim 2026, 01:30');
    const afterEnd = new Date('2026-10-25T22:30:00Z');
    expect(formatTrDateTime(afterEnd)).toBe('26 Ekim 2026, 01:30');
  });

  it('TR_TIMEZONE sabiti Europe/Istanbul', () => {
    expect(TR_TIMEZONE).toBe('Europe/Istanbul');
  });
});
