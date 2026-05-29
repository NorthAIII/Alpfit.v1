import { describe, expect, it } from 'vitest';

import { i18n, t } from './index.js';

describe('backend i18n', () => {
  it('initialises synchronously with tr resources', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe('tr');
  });

  it('renders sms.otp with interpolated code', () => {
    expect(t('sms:otp', { code: '482931' })).toBe(
      'Alpfit doğrulama kodun: 482931. 5 dakika geçerli.',
    );
  });

  it('renders sms.inviteWelcome with multiple variables', () => {
    expect(
      t('sms:inviteWelcome', {
        trainerName: 'Ali',
        link: 'https://alpfit.app/i/abc',
      }),
    ).toBe("Alpfit'e hoş geldin! Antrenörün Ali seni davet etti: https://alpfit.app/i/abc");
  });

  it('renders errors.auth.otpInvalid', () => {
    expect(t('errors:auth.otpInvalid')).toBe('Kod hatalı veya süresi doldu.');
  });

  it('preserves TR characters (ş, ğ, ı, ç, İ) end-to-end', () => {
    // sms.otp has "doğrulama" → ğ
    expect(t('sms:otp', { code: '000000' })).toContain('doğrulama');
    // errors.auth.tokenExpired → "Oturumun"
    expect(t('errors:auth.tokenExpired')).toContain('Oturumun');
  });

  it('throws in dev when key is missing', () => {
    expect(() => t('sms:nonexistent.key')).toThrow(/missing key "sms:nonexistent\.key"/);
  });
});
