import { fireEvent, waitFor } from '@testing-library/react-native';

import * as authApi from '../../src/api/auth';
import { useSessionStore } from '../../src/auth/session';
import { saveAuth, loadAuth } from '../../src/auth/storage';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import SettingsScreen from './settings';

// api/auth logout çağrıları mock'lanır (deterministik); expo-router replace izlenir.
jest.mock('../../src/api/auth', () => ({
  logout: jest.fn(() => Promise.resolve({ kind: 'ok' })),
  logoutAll: jest.fn(() => Promise.resolve({ kind: 'ok' })),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const api = jest.mocked(authApi);

const labels = {
  logout: i18n.t('settings:session.logout'),
  logoutAll: i18n.t('settings:session.logoutAll'),
  confirm: i18n.t('settings:session.confirm'),
  cancel: i18n.t('settings:session.cancel'),
};

beforeEach(async () => {
  mockReplace.mockClear();
  api.logout.mockClear();
  api.logoutAll.mockClear();
  useSessionStore.getState().clear();
  // Aktif oturum: access + refresh + rol.
  await saveAuth({ refreshToken: 'rt', role: 'trainer' });
  useSessionStore.getState().setSession({
    accessToken: 'at',
    refreshToken: 'rt',
    role: 'trainer',
  });
});

describe('SettingsScreen', () => {
  it('Çıkış yap → onay → logout(at, rt) + oturum temizlenir + landing', async () => {
    const { getByRole } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByRole('button', { name: labels.logout }));
    fireEvent.press(getByRole('button', { name: labels.confirm }));

    await waitFor(() => expect(api.logout).toHaveBeenCalledWith('at', 'rt'));
    expect(api.logoutAll).not.toHaveBeenCalled();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(useSessionStore.getState().accessToken).toBeUndefined();
    expect(await loadAuth()).toBeNull();
  });

  it('Tüm cihazlardan çıkış → onay → logoutAll(at) + landing', async () => {
    const { getByRole } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByRole('button', { name: labels.logoutAll }));
    fireEvent.press(getByRole('button', { name: labels.confirm }));

    await waitFor(() => expect(api.logoutAll).toHaveBeenCalledWith('at'));
    expect(api.logout).not.toHaveBeenCalled();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it('Vazgeç → onay kutusu kapanır, hiçbir çıkış çağrısı yapılmaz', async () => {
    const { getByRole, queryByRole } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByRole('button', { name: labels.logout }));
    expect(getByRole('button', { name: labels.confirm })).toBeTruthy();

    fireEvent.press(getByRole('button', { name: labels.cancel }));

    await waitFor(() => expect(queryByRole('button', { name: labels.confirm })).toBeNull());
    expect(api.logout).not.toHaveBeenCalled();
    expect(api.logoutAll).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
