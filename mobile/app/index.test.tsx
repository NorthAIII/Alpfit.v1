import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { useOnboardingStore } from '../src/onboarding/store';
import { server } from '../test/msw/server';
import { i18n, renderWithProviders } from '../test/render-with-providers';

import LandingScreen from './index';

// expo-router mock: yalnızca push çağrısını izleriz. Onboarding store gerçek
// zustand instance'ı — her testten önce reset edilir.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const PREVIEW_URL = '*/invitations/:code';

const memberLabel = i18n.t('common:role.member');
const trainerLabel = i18n.t('common:role.trainer');
const inviteLabel = i18n.t('common:role.invite');
const codeLabel = i18n.t('common:landing.inviteCodeLabel');
const submitLabel = i18n.t('common:landing.inviteSubmit');

function validPreview() {
  server.use(
    http.get(PREVIEW_URL, () =>
      HttpResponse.json({
        trainerFirstName: 'Mehmet',
        trainerLastName: 'Yılmaz',
        expiresAt: '2026-06-15T09:00:00.000Z',
      }),
    ),
  );
}

describe('LandingScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useOnboardingStore.getState().reset();
  });

  it('üç rol butonunu doğru i18n etiketleriyle render eder', () => {
    const { getByRole } = renderWithProviders(<LandingScreen />);
    expect(getByRole('button', { name: memberLabel })).toBeOnTheScreen();
    expect(getByRole('button', { name: trainerLabel })).toBeOnTheScreen();
    expect(getByRole('button', { name: inviteLabel })).toBeOnTheScreen();
  });

  it("'Üyeyim' → flow=member + telefon ekranına navigate", () => {
    const { getByRole } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: memberLabel }));
    expect(useOnboardingStore.getState().flow).toBe('member');
    expect(mockPush).toHaveBeenCalledWith('/auth/phone');
  });

  it("'Antrenörüm' → flow=pt + telefon ekranına navigate", () => {
    const { getByRole } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: trainerLabel }));
    expect(useOnboardingStore.getState().flow).toBe('pt');
    expect(mockPush).toHaveBeenCalledWith('/auth/phone');
  });

  it("'Davetim var' tıklayınca kod input görünür", () => {
    const { getByRole, queryByLabelText, getByLabelText } = renderWithProviders(<LandingScreen />);
    expect(queryByLabelText(codeLabel)).toBeNull();
    fireEvent.press(getByRole('button', { name: inviteLabel }));
    expect(getByLabelText(codeLabel)).toBeOnTheScreen();
  });

  it('6 karakter geçerli kod → preview success → flow=member_via_invite + navigate', async () => {
    validPreview();
    const { getByRole, getByLabelText } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: inviteLabel }));
    fireEvent.changeText(getByLabelText(codeLabel), 'ABC123');
    fireEvent.press(getByRole('button', { name: submitLabel }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/phone'));
    const s = useOnboardingStore.getState();
    expect(s.flow).toBe('member_via_invite');
    expect(s.invitationCode).toBe('ABC123');
  });

  it('geçersiz kod (404) → inline hata, navigate yok', async () => {
    server.use(
      http.get(PREVIEW_URL, () => HttpResponse.json({ status: 'not_found' }, { status: 404 })),
    );
    const { getByRole, getByLabelText, findByText } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: inviteLabel }));
    fireEvent.changeText(getByLabelText(codeLabel), 'BADAAA');
    fireEvent.press(getByRole('button', { name: submitLabel }));

    await findByText(i18n.t('errors:invitation_invalid'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(useOnboardingStore.getState().flow).toBeUndefined();
  });

  it('6 karakterden az kodda Devam butonu disabled', () => {
    const { getByRole, getByLabelText } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: inviteLabel }));
    fireEvent.changeText(getByLabelText(codeLabel), 'ABC');
    expect(getByRole('button', { name: submitLabel })).toBeDisabled();
  });

  it('kod girişi TR-güvenli büyük harfe çevrilir ve alfanümeriğe indirgenir', async () => {
    validPreview();
    const { getByRole, getByLabelText } = renderWithProviders(<LandingScreen />);
    fireEvent.press(getByRole('button', { name: inviteLabel }));
    // Karışık: küçük harf + tire + boşluk → normalize 'ABC123'.
    fireEvent.changeText(getByLabelText(codeLabel), 'abc-12 3x');
    fireEvent.press(getByRole('button', { name: submitLabel }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/phone'));
    expect(useOnboardingStore.getState().invitationCode).toBe('ABC123');
  });

  it('snapshot eşleşir (refactor güvencesi)', () => {
    const tree = renderWithProviders(<LandingScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
