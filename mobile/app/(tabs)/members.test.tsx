import { fireEvent, waitFor } from '@testing-library/react-native';
import * as mockReact from 'react';
import { Text } from 'react-native';

import * as invitationsApi from '../../src/api/invitations';
import * as trainersApi from '../../src/api/trainers';
import { useSessionStore } from '../../src/auth/session';
import { i18n, renderWithProviders } from '../../test/render-with-providers';

import MembersScreen from './members';

// api katmanı mock'lanır (listele/üret/iptal/üyeler) — sonuçlar deterministik.
// expo-clipboard + react-native-qrcode-svg mock'lanır (native bağımlılık).
// expo-router.useFocusEffect bir kez çalışan useEffect'e indirgenir.
jest.mock('../../src/api/invitations', () => ({
  createInvitation: jest.fn(),
  listInvitations: jest.fn(),
  cancelInvitation: jest.fn(),
}));
jest.mock('../../src/api/trainers', () => ({
  listMembers: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));

// QRCode mock'u `value` prop'unu metne yansıtır (testin URL doğrulaması için).
// mock-prefix (mockQrCode) jest hoisting kuralına uyar; require kullanılmaz.
function mockQrCode({ value }: { value: string }) {
  return <Text>{`QR:${value}`}</Text>;
}
jest.mock('react-native-qrcode-svg', () => ({ __esModule: true, default: mockQrCode }));

jest.mock('expo-router', () => {
  // useFocusEffectMock "use" ile başlar → rules-of-hooks custom hook kabul eder.
  const useFocusEffectMock = (cb: () => void) => mockReact.useEffect(cb, [cb]);
  return {
    useFocusEffect: useFocusEffectMock,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});

const Clipboard = jest.requireMock('expo-clipboard') as { setStringAsync: jest.Mock };
const inv = jest.mocked(invitationsApi);
const trn = jest.mocked(trainersApi);

const URL = 'https://alpfit.app/davet/ABC123';
const invitation = {
  id: 'inv-1',
  code: 'ABC123',
  url: URL,
  expiresAt: '2026-06-29T00:00:00.000Z',
};
const member = {
  id: 'm1',
  firstName: 'Ayşe',
  lastName: 'Kaya',
  joinedAt: '2026-05-01T00:00:00.000Z',
};

const labels = {
  emptyCta: i18n.t('members:empty.cta'),
  inviteCta: i18n.t('members:invite.cta'),
  copy: i18n.t('members:invite.copy'),
  qr: i18n.t('members:invite.qr'),
  pendingHeader: i18n.t('members:section.pending'),
  activeHeader: i18n.t('members:section.active'),
  inviteTitle: i18n.t('members:invite.title'),
  qrTitle: i18n.t('members:qr.title'),
  cancel: `${i18n.t('members:pending.cancel')} ${invitation.code}`,
};

describe('MembersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().setSession({
      accessToken: 'acc-1',
      refreshToken: 'ref-1',
      role: 'trainer',
    });
    // Varsayılan: boş listeler (testler gerektikçe override eder).
    inv.listInvitations.mockResolvedValue({ kind: 'ok', invitations: [] });
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [] });
  });

  it('boş liste → "İlk üyeni davet et" CTA görünür', async () => {
    const { findByLabelText } = renderWithProviders(<MembersScreen />);
    expect(await findByLabelText(labels.emptyCta)).toBeOnTheScreen();
  });

  it('bekleyen + aktif liste → her iki bölüm render edilir', async () => {
    inv.listInvitations.mockResolvedValue({ kind: 'ok', invitations: [invitation] });
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [member] });

    const { findByText, getByText } = renderWithProviders(<MembersScreen />);
    expect(await findByText(labels.pendingHeader)).toBeOnTheScreen();
    expect(getByText(labels.activeHeader)).toBeOnTheScreen();
    // Üye adı + davet kodu görünür.
    expect(getByText('Ayşe Kaya')).toBeOnTheScreen();
    expect(getByText('ABC123')).toBeOnTheScreen();
  });

  it('"Davet et" tap → POST 201 → davet modal açılır', async () => {
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [member] });
    inv.createInvitation.mockResolvedValue({ kind: 'created', invitation });

    const { findByLabelText, findByText } = renderWithProviders(<MembersScreen />);
    fireEvent.press(await findByLabelText(labels.inviteCta));

    await waitFor(() => expect(inv.createInvitation).toHaveBeenCalledWith('acc-1'));
    expect(await findByText(labels.inviteTitle)).toBeOnTheScreen();
  });

  it('"Linki kopyala" tap → Clipboard.setStringAsync url ile çağrılır', async () => {
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [member] });
    inv.createInvitation.mockResolvedValue({ kind: 'created', invitation });

    const { findByLabelText } = renderWithProviders(<MembersScreen />);
    fireEvent.press(await findByLabelText(labels.inviteCta));
    fireEvent.press(await findByLabelText(labels.copy));

    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(URL));
  });

  it('"QR göster" tap → QR modal görünür (URL kodlanır)', async () => {
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [member] });
    inv.createInvitation.mockResolvedValue({ kind: 'created', invitation });

    const { findByLabelText, findByText } = renderWithProviders(<MembersScreen />);
    fireEvent.press(await findByLabelText(labels.inviteCta));
    fireEvent.press(await findByLabelText(labels.qr));

    expect(await findByText(labels.qrTitle)).toBeOnTheScreen();
    // Mock QRCode value prop'unu yansıtır.
    expect(await findByText(`QR:${URL}`)).toBeOnTheScreen();
  });

  it('"İptal et" tap → DELETE çağrılır, liste yenilenir', async () => {
    inv.listInvitations.mockResolvedValue({ kind: 'ok', invitations: [invitation] });
    trn.listMembers.mockResolvedValue({ kind: 'ok', members: [] });
    inv.cancelInvitation.mockResolvedValue({ kind: 'cancelled' });

    const { findByLabelText } = renderWithProviders(<MembersScreen />);
    fireEvent.press(await findByLabelText(labels.cancel));

    await waitFor(() => expect(inv.cancelInvitation).toHaveBeenCalledWith('inv-1', 'acc-1'));
    // İlk yükleme + iptal sonrası tazeleme → listInvitations en az 2 kez.
    await waitFor(() => expect(inv.listInvitations.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
