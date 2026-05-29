import { fireEvent } from '@testing-library/react-native';

import { i18n, renderWithProviders } from '../../test/render-with-providers';

import KvkkConsentScreen from './kvkk';

// expo-router'ı mock'la: useRouter native Router context'i ister; izole
// component testinde sadece push çağrısının doğru argümanla yapıldığını
// doğrulamak yeterli.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// i18n string'lerini doğrudan kaynaktan al — accessible name eşleşmeleri
// hardcode metne değil çeviriye bağlı kalsın.
const kvkkLabel = i18n.t('kvkk:checkboxes.kvkk');
const saglikLabel = i18n.t('kvkk:checkboxes.saglik');
const ctaLabel = i18n.t('kvkk:cta');

describe('KvkkConsentScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('zorunlu KVKK tickbox işaretsizken Devam butonu disabled', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    expect(getByRole('button', { name: ctaLabel })).toBeDisabled();
  });

  it('zorunlu KVKK tickbox işaretlenince Devam butonu aktif olur', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    fireEvent.press(getByRole('checkbox', { name: kvkkLabel }));
    expect(getByRole('button', { name: ctaLabel })).toBeEnabled();
  });

  it('sağlık verisi tickbox opsiyonel — tek başına Devam butonunu aktive etmez', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    fireEvent.press(getByRole('checkbox', { name: saglikLabel }));
    expect(getByRole('button', { name: ctaLabel })).toBeDisabled();
  });

  it('KVKK işaretli + sağlık işaretsiz → Devam basınca healthConsent false ile navigate', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    fireEvent.press(getByRole('checkbox', { name: kvkkLabel }));
    fireEvent.press(getByRole('button', { name: ctaLabel }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/auth/profile',
      params: {
        kvkkConsent: 'true',
        healthConsent: 'false',
        kvkkTextVersion: i18n.t('kvkk:textVersion'),
      },
    });
  });

  it('KVKK + sağlık ikisi işaretli → Devam basınca healthConsent true ile navigate', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    fireEvent.press(getByRole('checkbox', { name: kvkkLabel }));
    fireEvent.press(getByRole('checkbox', { name: saglikLabel }));
    fireEvent.press(getByRole('button', { name: ctaLabel }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ healthConsent: 'true' }),
      }),
    );
  });

  it('checkbox accessibilityState.checked toggle ile güncellenir', () => {
    const { getByRole } = renderWithProviders(<KvkkConsentScreen />);
    const kvkkBox = getByRole('checkbox', { name: kvkkLabel });
    expect(kvkkBox).not.toBeChecked();
    fireEvent.press(kvkkBox);
    expect(kvkkBox).toBeChecked();
  });

  it('snapshot eşleşir (refactor güvencesi)', () => {
    const tree = renderWithProviders(<KvkkConsentScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
