import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { useOnboardingStore } from '../../src/onboarding/store';
import { server } from '../../test/msw/server';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import PhoneEntryScreen from './phone';

// expo-router mock: yalnızca push izlenir. Sentry mock'lanır — gerçek SDK'yı
// yüklemeden network hata yolundaki captureException'ı no-op yapar.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('../../src/observability/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

const SEND_URL = '*/auth/otp/send';

const phoneLabel = i18n.t('auth:phone.label');
const ctaLabel = i18n.t('auth:phone.cta');

// 555... geçerli TR mobil prefix; 212... İstanbul sabit hat → mobil değil.
const VALID_NATIONAL = '5551234567';
const INVALID_NATIONAL = '2125550000';

function okSend() {
  server.use(http.post(SEND_URL, () => HttpResponse.json({ success: true, expiresInSec: 300 })));
}

describe('PhoneEntryScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useOnboardingStore.getState().reset();
  });

  it('geçerli TR telefon → Devam aktifleşir, tap → OTP send + OTP ekranına navigate', async () => {
    okSend();
    const { getByLabelText, getByRole } = renderWithProviders(<PhoneEntryScreen />);
    fireEvent.changeText(getByLabelText(phoneLabel), VALID_NATIONAL);

    const cta = getByRole('button', { name: ctaLabel });
    await waitFor(() => expect(cta).toBeEnabled());
    fireEvent.press(cta);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/otp'));
    // E.164 store'a yazıldı (OTP ekranı bunu kullanır).
    expect(useOnboardingStore.getState().phone).toBe('+905551234567');
  });

  it('geçersiz telefon → Devam disabled + inline hata, navigate yok', async () => {
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<PhoneEntryScreen />);
    fireEvent.changeText(getByLabelText(phoneLabel), INVALID_NATIONAL);

    await findByText(i18n.t('auth:phone.error.invalid'));
    expect(getByRole('button', { name: ctaLabel })).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('429 → rate limit countdown mesajı, navigate yok', async () => {
    server.use(
      http.post(SEND_URL, () =>
        HttpResponse.json(
          { status: 'rate_limited' },
          { status: 429, headers: { 'Retry-After': '60' } },
        ),
      ),
    );
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<PhoneEntryScreen />);
    fireEvent.changeText(getByLabelText(phoneLabel), VALID_NATIONAL);

    const cta = getByRole('button', { name: ctaLabel });
    await waitFor(() => expect(cta).toBeEnabled());
    fireEvent.press(cta);

    await findByText(i18n.t('errors:rate_limit', { seconds: 60 }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('network hatası → bağlantı mesajı, navigate yok', async () => {
    server.use(http.post(SEND_URL, () => HttpResponse.error()));
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<PhoneEntryScreen />);
    fireEvent.changeText(getByLabelText(phoneLabel), VALID_NATIONAL);

    const cta = getByRole('button', { name: ctaLabel });
    await waitFor(() => expect(cta).toBeEnabled());
    fireEvent.press(cta);

    await findByText(i18n.t('errors:network'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('mask: ulusal numara 5XX XXX XX XX olarak gruplanır', () => {
    const { getByLabelText } = renderWithProviders(<PhoneEntryScreen />);
    const input = getByLabelText(phoneLabel);
    fireEvent.changeText(input, '5551234567');
    expect(input.props['value']).toBe('555 123 45 67');
  });
});
