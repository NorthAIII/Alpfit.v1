import { act, fireEvent, waitFor } from '@testing-library/react-native';

import * as authApi from '../../src/api/auth';
import { useOnboardingStore } from '../../src/onboarding/store';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import OtpEntryScreen from './otp';

// api/auth tamamen mock'lanır — testler verify/send/dev-lookup sonuçlarını
// deterministik kontrol eder, timer testleri network microtask'larından bağımsız
// kalır. expo-router push/replace izlenir.
jest.mock('../../src/api/auth', () => ({
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  fetchDevOtp: jest.fn(),
  isDevOtpLookupEnabled: jest.fn(),
}));

// auth-actions mock'lanır: persistLogin (jeton kalıcılaştırma + rol çözümü) ağ
// yapmadan rol döndürür; homePathForRole gerçek davranışı taklit eder.
jest.mock('../../src/auth/auth-actions', () => ({
  persistLogin: jest.fn(() => Promise.resolve('member')),
  homePathForRole: (role: 'member' | 'trainer') => (role === 'trainer' ? '/members' : '/home'),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const api = jest.mocked(authApi);
const { persistLogin } = jest.mocked(
  jest.requireMock('../../src/auth/auth-actions') as typeof import('../../src/auth/auth-actions'),
);

const PHONE = '+905551234567';
const boxLabel = (oneBased: number) => i18n.t('auth:otp.boxLabel', { index: oneBased });
const resendLabel = i18n.t('auth:otp.resend');
const devLabel = i18n.t('auth:otp.devLookup');

describe('OtpEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().reset();
    useOnboardingStore.getState().setPhone(PHONE);
    api.isDevOtpLookupEnabled.mockReturnValue(false);
    api.sendOtp.mockResolvedValue({ kind: 'sent', expiresInSec: 300 });
  });

  it('doğru kod (yeni kullanıcı) → registrationToken store + KVKK ekranına navigate', async () => {
    api.verifyOtp.mockResolvedValue({ kind: 'registered', registrationToken: 'reg-xyz' });
    const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);

    // Tek kutuya 6 hane = yapıştırma → dağıtılır → onComplete → verify.
    fireEvent.changeText(getByLabelText(boxLabel(1)), '123456');

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/kvkk'));
    expect(api.verifyOtp).toHaveBeenCalledWith(PHONE, '123456');
    expect(useOnboardingStore.getState().registrationToken).toBe('reg-xyz');
  });

  it('mevcut kullanıcı (logged_in) → jeton persist + role göre ana ekrana replace', async () => {
    api.verifyOtp.mockResolvedValue({
      kind: 'logged_in',
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: '2026-07-01T00:00:00.000Z',
    });
    persistLogin.mockResolvedValue('member');
    const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);
    fireEvent.changeText(getByLabelText(boxLabel(1)), '123456');

    await waitFor(() =>
      expect(persistLogin).toHaveBeenCalledWith({
        accessToken: 'a',
        refreshToken: 'r',
      }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('yanlış kod → 401 → input sıfırlanır + hata mesajı', async () => {
    api.verifyOtp.mockResolvedValue({ kind: 'invalid_code' });
    const { getByLabelText, findByText } = renderWithProviders(<OtpEntryScreen />);
    fireEvent.changeText(getByLabelText(boxLabel(1)), '999999');

    await findByText(i18n.t('errors:otp.invalid'));
    expect(getByLabelText(boxLabel(1)).props['value']).toBe('');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('5 hatalı → 423 → kilit mesajı + giriş kapanır', async () => {
    api.verifyOtp.mockResolvedValue({ kind: 'locked', retryAfterSec: 900 });
    const { getByLabelText, findByText } = renderWithProviders(<OtpEntryScreen />);
    fireEvent.changeText(getByLabelText(boxLabel(1)), '123456');

    await findByText(/Çok fazla yanlış deneme/);
    expect(getByLabelText(boxLabel(1)).props['editable']).toBe(false);
  });

  it('süre dolduğunda (timer 0) → süresi doldu mesajı', () => {
    jest.useFakeTimers();
    try {
      const { getByText } = renderWithProviders(<OtpEntryScreen />);
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });
      expect(getByText(i18n.t('errors:otp.expired'))).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('yeniden gönder 60sn sonra aktif → tap → send çağrılır', async () => {
    jest.useFakeTimers();
    try {
      const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);
      const resendBtn = getByLabelText(resendLabel);
      expect(resendBtn).toBeDisabled();

      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });
      expect(resendBtn).toBeEnabled();

      fireEvent.press(resendBtn);
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.sendOtp).toHaveBeenCalledWith(PHONE);
    } finally {
      jest.useRealTimers();
    }
  });

  it('tek tek 6 hane girişi → otomatik ilerler → verify tetiklenir', async () => {
    api.verifyOtp.mockResolvedValue({ kind: 'registered', registrationToken: 'r' });
    const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);
    for (let i = 0; i < 6; i += 1) {
      fireEvent.changeText(getByLabelText(boxLabel(i + 1)), String(i + 1));
    }
    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith(PHONE, '123456'));
  });

  it('paste 6 hane → otomatik dağıtılır → verify tam kodla çağrılır', async () => {
    api.verifyOtp.mockResolvedValue({ kind: 'registered', registrationToken: 'r' });
    const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);
    fireEvent.changeText(getByLabelText(boxLabel(1)), '654321');
    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith(PHONE, '654321'));
  });

  it('dev OTP getir → kodu doldurur + verify eder', async () => {
    api.isDevOtpLookupEnabled.mockReturnValue(true);
    api.fetchDevOtp.mockResolvedValue({ kind: 'ok', code: '112233' });
    api.verifyOtp.mockResolvedValue({ kind: 'registered', registrationToken: 'r' });
    const { getByLabelText } = renderWithProviders(<OtpEntryScreen />);

    fireEvent.press(getByLabelText(devLabel));
    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith(PHONE, '112233'));
  });
});
