import { fireEvent, waitFor } from '@testing-library/react-native';

import * as authApi from '../../src/api/auth';
import { useOnboardingStore } from '../../src/onboarding/store';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import ProfileScreen from './profile';

// api/auth mock'lanır — createProfile/acceptInvitation sonuçları deterministik
// kontrol edilir. expo-router push/replace izlenir; useLocalSearchParams KVKK
// ekranından gelen rıza param'larını taklit eder.
jest.mock('../../src/api/auth', () => ({
  createProfile: jest.fn(),
  acceptInvitation: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({ kvkkConsent: 'true', healthConsent: 'false' }),
}));

const api = jest.mocked(authApi);

const labels = {
  first: i18n.t('auth:profile.firstname'),
  last: i18n.t('auth:profile.lastname'),
  gym: i18n.t('auth:profile.gym'),
  cta: i18n.t('auth:profile.cta'),
  loginCta: i18n.t('auth:profile.loginCta'),
};

function createdUser(firstName: string) {
  return {
    kind: 'created' as const,
    accessToken: 'acc-1',
    refreshToken: 'ref-1',
    expiresAt: '2026-07-01T00:00:00.000Z',
    user: {
      id: 'u1',
      role: 'member' as const,
      firstName,
      lastName: 'Yılmaz',
      phoneE164: '+905551234567',
      gymName: null,
      certificateNote: null,
    },
  };
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().reset();
    useOnboardingStore.getState().setRegistrationToken('reg-token');
  });

  it('üye akışı: isim + soyisim dolu → 201 → home ekranına replace', async () => {
    useOnboardingStore.getState().selectRole('member');
    api.createProfile.mockResolvedValue(createdUser('Ayşe'));

    const { getByLabelText } = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(getByLabelText(labels.first), 'Ayşe');
    fireEvent.changeText(getByLabelText(labels.last), 'Yılmaz');
    fireEvent.press(getByLabelText(labels.cta));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/home',
        params: { name: 'Ayşe' },
      }),
    );
    expect(api.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'member', firstName: 'Ayşe', lastName: 'Yılmaz' }),
    );
    // Üye akışında davet kabulü tetiklenmez.
    expect(api.acceptInvitation).not.toHaveBeenCalled();
  });

  it('PT akışı: PT-only alanlar görünür, ek alanlar boş submit edilebilir', async () => {
    useOnboardingStore.getState().selectRole('pt');
    api.createProfile.mockResolvedValue({
      ...createdUser('Mehmet'),
      user: { ...createdUser('Mehmet').user, role: 'trainer' },
    });

    const { getByLabelText } = renderWithProviders(<ProfileScreen />);
    // PT-only alan görünür.
    expect(getByLabelText(labels.gym)).toBeTruthy();

    fireEvent.changeText(getByLabelText(labels.first), 'Mehmet');
    fireEvent.changeText(getByLabelText(labels.last), 'Demir');
    fireEvent.press(getByLabelText(labels.cta));

    await waitFor(() => expect(api.createProfile).toHaveBeenCalled());
    // gym/cert boş → gövdeye eklenmemeli.
    const arg = api.createProfile.mock.calls[0]?.[0];
    expect(arg).toMatchObject({ role: 'trainer', firstName: 'Mehmet', lastName: 'Demir' });
    expect(arg).not.toHaveProperty('gymName');
    expect(arg).not.toHaveProperty('certificateNote');
  });

  it('üye akışında PT-only alanlar gizli', () => {
    useOnboardingStore.getState().selectRole('member');
    const { queryByLabelText } = renderWithProviders(<ProfileScreen />);
    expect(queryByLabelText(labels.gym)).toBeNull();
  });

  it('geçersiz isim (sayı içerir) → blur sonrası inline hata + submit kapalı', () => {
    useOnboardingStore.getState().selectRole('member');
    const { getByLabelText, getByText } = renderWithProviders(<ProfileScreen />);

    const firstInput = getByLabelText(labels.first);
    fireEvent.changeText(firstInput, 'Ali1');
    fireEvent(firstInput, 'blur');

    expect(getByText(i18n.t('auth:profile.nameError'))).toBeTruthy();
    expect(getByLabelText(labels.cta)).toBeDisabled();
    expect(api.createProfile).not.toHaveBeenCalled();
  });

  it('409 phone_taken → mesaj + "Giriş yap" → telefon ekranına replace', async () => {
    useOnboardingStore.getState().selectRole('member');
    api.createProfile.mockResolvedValue({ kind: 'phone_taken' });

    const { getByLabelText, findByText } = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(getByLabelText(labels.first), 'Ayşe');
    fireEvent.changeText(getByLabelText(labels.last), 'Yılmaz');
    fireEvent.press(getByLabelText(labels.cta));

    await findByText(i18n.t('auth:profile.phoneTaken'));
    fireEvent.press(getByLabelText(labels.loginCta));
    expect(mockReplace).toHaveBeenCalledWith('/auth/phone');
  });

  it('member_via_invite: profil create + davet accept ardışık → home', async () => {
    useOnboardingStore.getState().selectInvite('ABC123');
    useOnboardingStore.getState().setRegistrationToken('reg-token');
    api.createProfile.mockResolvedValue(createdUser('Zeynep'));
    api.acceptInvitation.mockResolvedValue({
      kind: 'connected',
      trainerFirstName: 'Mehmet',
      trainerLastName: 'Yılmaz',
    });

    const { getByLabelText } = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(getByLabelText(labels.first), 'Zeynep');
    fireEvent.changeText(getByLabelText(labels.last), 'Kaya');
    fireEvent.press(getByLabelText(labels.cta));

    await waitFor(() => expect(api.acceptInvitation).toHaveBeenCalledWith('ABC123', 'acc-1'));
    expect(api.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'member', firstName: 'Zeynep' }),
    );
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/home', params: { name: 'Zeynep' } });
  });

  it('member_via_invite: accept başarısız → uyarı gösterir, home replace etmez', async () => {
    useOnboardingStore.getState().selectInvite('ABC123');
    useOnboardingStore.getState().setRegistrationToken('reg-token');
    api.createProfile.mockResolvedValue(createdUser('Zeynep'));
    api.acceptInvitation.mockResolvedValue({ kind: 'failed' });

    const { getByLabelText, findByText } = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(getByLabelText(labels.first), 'Zeynep');
    fireEvent.changeText(getByLabelText(labels.last), 'Kaya');
    fireEvent.press(getByLabelText(labels.cta));

    await findByText(i18n.t('auth:profile.inviteFailed'));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
