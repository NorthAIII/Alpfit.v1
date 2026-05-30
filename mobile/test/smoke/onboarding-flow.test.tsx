import { fireEvent, waitFor } from '@testing-library/react-native';
import * as mockReact from 'react';
import { Text } from 'react-native';

import MembersScreen from '../../app/(tabs)/members';
import KvkkConsentScreen from '../../app/auth/kvkk';
import OtpEntryScreen from '../../app/auth/otp';
import PhoneEntryScreen from '../../app/auth/phone';
import ProfileScreen from '../../app/auth/profile';
import DavetCodeScreen from '../../app/davet/[code]';
import LandingScreen from '../../app/index';
import { bootstrapSession } from '../../src/auth/auth-actions';
import { useSessionStore } from '../../src/auth/session';
import { loadAuth, saveAuth } from '../../src/auth/storage';
import { useOnboardingStore } from '../../src/onboarding/store';
import {
  authMeOk,
  authRefreshOk,
  invitationAccepted,
  invitationCreated,
  invitationPreviewValid,
  invitationsList,
  otpSendOk,
  otpVerifyNewUser,
  profileCreated,
  trainersEvents,
  trainersMembers,
  type MockUser,
} from '../msw/handlers';
import { server } from '../msw/server';
import { i18n, renderWithProviders } from '../render-with-providers';

// TASK-1.34 — M0 + M1 mobile uçtan uca onboarding smoke testi. Gerçek api/*
// modülleri + gerçek ekranlar + gerçek store'lar; backend MSW ile mock'lanır
// (jest.mock api YOK — bu suite api↔ekran↔store telini bütünsel doğrular). Expo
// Router file-based olduğundan ekranlar tek tek render edilir ve navigation
// çağrısı (mockRouter) + ortak onboarding store ile zincirlenir. Senaryolar:
//   1. Landing → "Üyeyim" → telefon → OTP → KVKK → profil → home
//   2. Deep link davet → telefon → OTP → KVKK → profil + auto-accept → home
//   3. PT açılışı → Üyeler sekmesi → "+ davet et" → modal → kopyala
//   4. Auto-login (saklı refresh token) → boot → authenticated (OTP atlanır)
//
// E2E (Maestro) Yakın 5'te; bu task component/integration-level kapsam.

// Kalıcı navigation spy'ları + mutable route param holder. jest.mock factory
// out-of-scope referansı `mock` prefix'iyle yapılır (hoisting kuralı).
const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockParams: { current: Record<string, string> } = { current: {} };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams.current,
  // useFocusEffect → bir kez çalışan useEffect (members + use-pt-events için).
  useFocusEffect: (cb: () => void) => mockReact.useEffect(cb, [cb]),
}));

// Native bağımlılıklar (PT senaryosu): clipboard + QR. expo-secure-store mock'u
// jest.config moduleNameMapper'da bağlı (storage gerçek çalışır, bellek-içi).
// Gerçek Sentry modülü AsyncExpiringMap cleanup interval'i kurar (unref'siz →
// worker leak). Phone ekranı Sentry'yi import eder; izole stub yeterli.
jest.mock('../../src/observability/sentry', () => ({
  Sentry: { captureException: jest.fn(), wrap: (c: unknown) => c },
  initSentryFromEnv: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));
function mockQrCode({ value }: { value: string }) {
  return <Text>{`QR:${value}`}</Text>;
}
jest.mock('react-native-qrcode-svg', () => ({ __esModule: true, default: mockQrCode }));

const Clipboard = jest.requireMock('expo-clipboard') as { setStringAsync: jest.Mock };

// i18n.t strict literal-key overload'ı widened `string` ile uyuşmaz; testte
// dinamik anahtar için kasıtlı gevşetme (runtime'da undefined opts sorunsuz).
const t = (key: string, opts?: Record<string, unknown>): string =>
  i18n.t(key as never, opts as never) as unknown as string;

const MEMBER_USER: MockUser = {
  id: 'm-1',
  role: 'member',
  firstName: 'Ada',
  lastName: 'Yıldız',
  phoneE164: '+905551234567',
  gymName: null,
  certificateNote: null,
};
const TRAINER_USER: MockUser = {
  id: 'pt-1',
  role: 'trainer',
  firstName: 'Mert',
  lastName: 'Demir',
  phoneE164: '+905559876543',
  gymName: null,
  certificateNote: null,
};

/** Telefon → OTP → KVKK adımlarını sürer (her ekranı render edip unmount eder). */
async function driveAuthChain(registrationToken: string) {
  // Telefon ekranı: ulusal numara yaz → debounce doğrulamasını bekle → Devam.
  const phone = renderWithProviders(<PhoneEntryScreen />);
  fireEvent.changeText(phone.getByLabelText(t('auth:phone.label')), '5551234567');
  await waitFor(() => expect(phone.getByLabelText(t('auth:phone.cta'))).toBeEnabled());
  fireEvent.press(phone.getByLabelText(t('auth:phone.cta')));
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/auth/otp'));
  expect(useOnboardingStore.getState().phone).toBe('+905551234567');
  phone.unmount();

  // OTP ekranı: 6 hane → verify (yeni kullanıcı) → KVKK'ya.
  const otp = renderWithProviders(<OtpEntryScreen />);
  fireEvent.changeText(otp.getByLabelText(t('auth:otp.boxLabel', { index: 1 })), '123456');
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/auth/kvkk'));
  expect(useOnboardingStore.getState().registrationToken).toBe(registrationToken);
  otp.unmount();

  // KVKK ekranı: zorunlu onay → profil ekranına (consent route param ile).
  const kvkk = renderWithProviders(<KvkkConsentScreen />);
  fireEvent.press(kvkk.getByLabelText(t('kvkk:checkboxes.kvkk')));
  fireEvent.press(kvkk.getByLabelText(t('kvkk:cta')));
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/auth/profile' }),
    ),
  );
  kvkk.unmount();
  // Profil ekranı consent'i route param'dan okur (KVKK ekranının ürettiği değerler).
  mockParams.current = { kvkkConsent: 'true', healthConsent: 'false' };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.current = {};
  useOnboardingStore.getState().reset();
  useSessionStore.getState().clear();
});

describe('TASK-1.34 — mobile onboarding uçtan uca smoke', () => {
  it('1 — üye: Landing → telefon → OTP → KVKK → profil → home', async () => {
    server.use(otpSendOk(), otpVerifyNewUser('reg-1'), profileCreated(MEMBER_USER));

    // Landing: "Üyeyim" → davetsiz üye akışı.
    const landing = renderWithProviders(<LandingScreen />);
    fireEvent.press(landing.getByLabelText(t('common:role.member')));
    expect(useOnboardingStore.getState().flow).toBe('member');
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/phone');
    landing.unmount();

    await driveAuthChain('reg-1');

    // Profil: ad/soyad → Hesabı oluştur → 201 → oturum kalıcı + home.
    const profile = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(profile.getByLabelText(t('auth:profile.firstname')), 'Ada');
    fireEvent.changeText(profile.getByLabelText(t('auth:profile.lastname')), 'Yıldız');
    fireEvent.press(profile.getByLabelText(t('auth:profile.cta')));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/home' }),
      ),
    );
    // 30 gün cihaz hatırlama: refresh token + rol secure storage'a yazıldı.
    expect(useSessionStore.getState().accessToken).toBe('at-new');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-new', role: 'member' });
    profile.unmount();
  });

  it('2 — deep link davet: önizleme → onboarding → auto-accept → home', async () => {
    server.use(
      invitationPreviewValid({ trainerFirstName: 'Mert', trainerLastName: 'Demir' }),
      otpSendOk(),
      otpVerifyNewUser('reg-2'),
      profileCreated(MEMBER_USER),
      invitationAccepted({ trainerFirstName: 'Mert', trainerLastName: 'Demir' }),
    );

    // Deep link landing: kod route param'da → preview yüklenir → "Devam et".
    mockParams.current = { code: 'ABC123' };
    const davet = renderWithProviders(<DavetCodeScreen />);
    await waitFor(() => expect(davet.getByLabelText(t('davet:valid.cta'))).toBeOnTheScreen());
    fireEvent.press(davet.getByLabelText(t('davet:valid.cta')));
    expect(useOnboardingStore.getState().flow).toBe('member_via_invite');
    expect(useOnboardingStore.getState().invitationCode).toBe('ABC123');
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/phone');
    davet.unmount();

    await driveAuthChain('reg-2');

    // Profil: 201 → davet otomatik kabul (member_via_invite) → home.
    const profile = renderWithProviders(<ProfileScreen />);
    fireEvent.changeText(profile.getByLabelText(t('auth:profile.firstname')), 'Ada');
    fireEvent.changeText(profile.getByLabelText(t('auth:profile.lastname')), 'Yıldız');
    fireEvent.press(profile.getByLabelText(t('auth:profile.cta')));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/home' }),
      ),
    );
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-new', role: 'member' });
    profile.unmount();
  });

  it('3 — PT: Üyeler sekmesi → davet üret → modal → linki kopyala', async () => {
    useSessionStore.getState().setSession({
      accessToken: 'acc-pt',
      refreshToken: 'ref-pt',
      role: 'trainer',
    });
    const invitation = {
      id: 'inv-1',
      code: 'XYZ789',
      url: 'https://alpfit.app/davet/XYZ789',
      expiresAt: '2026-07-01T00:00:00.000Z',
    };
    server.use(
      invitationsList([]),
      trainersMembers([]),
      trainersEvents([]),
      invitationCreated(invitation),
    );

    const members = renderWithProviders(<MembersScreen />);
    // Boş liste → "İlk üyeni davet et" CTA → POST /invitations → davet modal.
    fireEvent.press(await members.findByLabelText(t('members:empty.cta')));
    expect(await members.findByText(t('members:invite.title'))).toBeOnTheScreen();

    // "Linki kopyala" → Clipboard davet URL'si ile çağrılır.
    fireEvent.press(members.getByLabelText(t('members:invite.copy')));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(invitation.url));
    // use-pt-events 20sn poll timer'ını deterministik kapat (RTL auto-cleanup yedek).
    members.unmount();
  });

  it('4 — auto-login: saklı refresh token → boot → authenticated (OTP atlanır)', async () => {
    // 30 gün cihaz hatırlama: önceki oturumdan saklı refresh token + rol.
    await saveAuth({ refreshToken: 'rt-stored', role: 'trainer' });
    server.use(authRefreshOk(), authMeOk(TRAINER_USER));

    const result = await bootstrapSession();

    expect(result).toEqual({ kind: 'authenticated', role: 'trainer' });
    // Boot refresh oturum store'unu doldurdu; rotate edilen yeni token saklandı.
    expect(useSessionStore.getState().accessToken).toBe('at-boot');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-boot', role: 'trainer' });
  });
});
