import { describe, expect, it } from 'vitest';

import { formatTrPhone, parseTrPhone, validateTrPhone } from './phone.js';

describe('parseTrPhone', () => {
  it('+90 prefix ile E.164 verir', () => {
    const r = parseTrPhone('+90 555 123 45 67');
    expect(r.e164).toBe('+905551234567');
    expect(r.valid).toBe(true);
  });

  it('0 prefix ile (TR ulusal format) E.164 verir', () => {
    const r = parseTrPhone('0555 123 45 67');
    expect(r.e164).toBe('+905551234567');
    expect(r.valid).toBe(true);
  });

  it('prefix yok (yalın 10 hane) E.164 verir', () => {
    const r = parseTrPhone('5551234567');
    expect(r.e164).toBe('+905551234567');
    expect(r.valid).toBe(true);
  });

  it('boşluksuz +90 formatı kabul edilir', () => {
    const r = parseTrPhone('+905551234567');
    expect(r.e164).toBe('+905551234567');
    expect(r.valid).toBe(true);
  });

  it('TR sabit hat (0212) reddedilir', () => {
    const r = parseTrPhone('0212 555 12 34');
    expect(r.valid).toBe(false);
  });

  it('TR sabit hat (0312) reddedilir', () => {
    const r = parseTrPhone('+90 312 555 12 34');
    expect(r.valid).toBe(false);
  });

  it('yabancı numara (+1 US) reddedilir', () => {
    const r = parseTrPhone('+1 555 123 4567');
    expect(r.valid).toBe(false);
  });

  it('yabancı numara (+44 UK) reddedilir', () => {
    const r = parseTrPhone('+44 7700 900000');
    expect(r.valid).toBe(false);
  });

  it('boş string reddedilir', () => {
    expect(parseTrPhone('').valid).toBe(false);
    expect(parseTrPhone('   ').valid).toBe(false);
  });

  it('çöp girdi reddedilir', () => {
    expect(parseTrPhone('abc').valid).toBe(false);
    expect(parseTrPhone('123').valid).toBe(false);
  });

  it('eksik haneli numara reddedilir', () => {
    expect(parseTrPhone('+90 555 123').valid).toBe(false);
  });
});

describe('formatTrPhone', () => {
  it('E.164 → human-readable TR formatı', () => {
    expect(formatTrPhone('+905551234567')).toBe('+90 555 123 45 67');
  });

  it('geçersiz E.164 olduğu gibi döner', () => {
    expect(formatTrPhone('+90555garbage')).toBe('+90555garbage');
  });

  it('boş string boş döner', () => {
    expect(formatTrPhone('')).toBe('');
  });
});

describe('validateTrPhone', () => {
  it('TR mobil için true', () => {
    expect(validateTrPhone('+905551234567')).toBe(true);
  });

  it('yabancı için false', () => {
    expect(validateTrPhone('+15551234567')).toBe(false);
  });

  it('sabit hat için false', () => {
    expect(validateTrPhone('+902125551234')).toBe(false);
  });
});
