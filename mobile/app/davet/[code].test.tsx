import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { server } from '../../test/msw/server';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import DavetCodeScreen from './[code]';

// expo-router mock: useRouter.push'ı izleriz, useLocalSearchParams sabit kod
// döner. Hangi cevabın döneceğini MSW handler'ı (host-agnostic wildcard)
// belirler — kod değeri response'u etkilemez.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ code: 'ABC123' }),
}));

const PREVIEW_URL = '*/invitations/:code';

describe('DavetCodeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('geçerli davet → PT adı + son geçerlilik + Devam et render eder', async () => {
    server.use(
      http.get(PREVIEW_URL, () =>
        HttpResponse.json({
          trainerFirstName: 'Mehmet',
          trainerLastName: 'Yılmaz',
          expiresAt: '2026-06-15T09:00:00.000Z',
        }),
      ),
    );
    const { findByText, getByRole } = renderWithProviders(<DavetCodeScreen />);

    await findByText(i18n.t('davet:valid.subtitle', { trainer: 'Mehmet Yılmaz' }));
    expect(getByRole('button', { name: i18n.t('davet:valid.cta') })).toBeOnTheScreen();
  });

  it('Devam et basınca davet kodu param ile navigate eder', async () => {
    server.use(
      http.get(PREVIEW_URL, () =>
        HttpResponse.json({
          trainerFirstName: 'Mehmet',
          trainerLastName: 'Yılmaz',
          expiresAt: '2026-06-15T09:00:00.000Z',
        }),
      ),
    );
    const { findByRole } = renderWithProviders(<DavetCodeScreen />);

    const cta = await findByRole('button', { name: i18n.t('davet:valid.cta') });
    fireEvent.press(cta);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/',
      params: { inviteCode: 'ABC123' },
    });
  });

  it('404 → "geçersiz" başlığı gösterir', async () => {
    server.use(
      http.get(PREVIEW_URL, () => HttpResponse.json({ status: 'not_found' }, { status: 404 })),
    );
    const { findByText } = renderWithProviders(<DavetCodeScreen />);
    await findByText(i18n.t('davet:error.notFound.title'));
  });

  it('410 expired → "süresi dolmuş" başlığı gösterir', async () => {
    server.use(
      http.get(PREVIEW_URL, () => HttpResponse.json({ status: 'expired' }, { status: 410 })),
    );
    const { findByText } = renderWithProviders(<DavetCodeScreen />);
    await findByText(i18n.t('davet:error.expired.title'));
  });

  it('410 accepted → "zaten kullanılmış" başlığı gösterir', async () => {
    server.use(
      http.get(PREVIEW_URL, () => HttpResponse.json({ status: 'accepted' }, { status: 410 })),
    );
    const { findByText } = renderWithProviders(<DavetCodeScreen />);
    await findByText(i18n.t('davet:error.used.title'));
  });

  it('ağ hatası → "tekrar dene" gösterir ve retry yeniden çağırır', async () => {
    // İlk istek 500 (network kind), retry sonrası geçerli cevap.
    let calls = 0;
    server.use(
      http.get(PREVIEW_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ status: 'error' }, { status: 500 });
        }
        return HttpResponse.json({
          trainerFirstName: 'Mehmet',
          trainerLastName: 'Yılmaz',
          expiresAt: '2026-06-15T09:00:00.000Z',
        });
      }),
    );
    const { findByRole, findByText } = renderWithProviders(<DavetCodeScreen />);

    const retry = await findByRole('button', { name: i18n.t('davet:error.network.retry') });
    fireEvent.press(retry);
    await findByText(i18n.t('davet:valid.subtitle', { trainer: 'Mehmet Yılmaz' }));
    await waitFor(() => expect(calls).toBe(2));
  });
});
