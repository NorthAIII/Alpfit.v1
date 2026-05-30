// MemberDetailScreen component testi.
// useTrainerMemberProgram + useCreateProgram hook'ları mock'lanır.
// expo-router (useLocalSearchParams, useRouter) mock'lanır.

import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import MemberDetailScreen from './[memberId]';

jest.mock('../../src/hooks/useProgram', () => ({
  useTrainerMemberProgram: jest.fn(),
  useCreateProgram: jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const hooks = jest.mocked(require('../../src/hooks/useProgram'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const routerMod = jest.mocked(require('expo-router'));

const MEMBER_PARAMS = {
  memberId: 'm-1',
  firstName: 'Ayşe',
  lastName: 'Kaya',
  joinedAt: '2026-05-01T00:00:00.000Z',
};

const PROGRAM = {
  id: 'prog-1',
  trainerId: 'tr-1',
  memberId: 'm-1',
  status: 'active' as const,
  days: [],
  publishedAt: '2026-05-10T00:00:00.000Z',
  archivedAt: null,
};

const defaultCreateProgram = {
  mutate: jest.fn(),
  isPending: false,
};

function setup(overrides?: { program?: typeof PROGRAM | null; isLoading?: boolean }) {
  routerMod.useLocalSearchParams.mockReturnValue(MEMBER_PARAMS);
  hooks.useTrainerMemberProgram.mockReturnValue({
    data: overrides?.program !== undefined ? overrides.program : null,
    isLoading: overrides?.isLoading ?? false,
  });
  return renderWithProviders(<MemberDetailScreen />);
}

describe('MemberDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Her test için varsayılan mock; testler gerekirse üzerine yazar.
    hooks.useCreateProgram.mockReturnValue(defaultCreateProgram);
  });

  it('üye adı ve katılım tarihi görünür', async () => {
    const { getByText } = setup();
    expect(getByText('Ayşe Kaya')).toBeOnTheScreen();
    // formatTrDate('2026-05-01') → "01 Mayıs 2026"
    expect(getByText(/Üye oldu:/)).toBeOnTheScreen();
    expect(getByText(/Mayıs 2026/)).toBeOnTheScreen();
  });

  it('isLoading=true iken spinner gösterilir', () => {
    const { getByTestId } = setup({ isLoading: true });
    expect(getByTestId('member-detail-loading')).toBeOnTheScreen();
  });

  it('aktif program yokken "Program yaz" CTA görünür', () => {
    const { getByTestId } = setup({ program: null });
    expect(getByTestId('create-program-button')).toBeOnTheScreen();
  });

  it('aktif program varsa "Mevcut programı düzenle" ve "Yeni program yaz" görünür', () => {
    const { getByTestId } = setup({ program: PROGRAM });
    expect(getByTestId('edit-program-button')).toBeOnTheScreen();
    expect(getByTestId('new-program-button')).toBeOnTheScreen();
  });

  it('"Program yaz" basılınca useCreateProgram.mutate çağrılır', async () => {
    const mutate = jest.fn();
    hooks.useCreateProgram.mockReturnValue({ mutate, isPending: false });
    const { getByTestId } = setup({ program: null });

    fireEvent.press(getByTestId('create-program-button'));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
  });

  it('"Mevcut programı düzenle" basılınca builder ekranına navigate edilir', () => {
    const { getByTestId } = setup({ program: PROGRAM });
    fireEvent.press(getByTestId('edit-program-button'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/program/prog-1'));
  });

  it('onSuccess çağrılınca builder ekranına push yapılır', () => {
    let capturedOnSuccess: ((id: string) => void) | undefined;
    hooks.useCreateProgram.mockImplementation(
      ({ onSuccess }: { onSuccess: (id: string) => void }) => {
        capturedOnSuccess = onSuccess;
        return defaultCreateProgram;
      },
    );

    setup({ program: null });

    capturedOnSuccess?.('new-prog-id');
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/program/new-prog-id'));
  });

  it('"Geri" butonu router.back çağırır', () => {
    const { getByLabelText } = setup();
    fireEvent.press(getByLabelText('Geri'));
    expect(mockBack).toHaveBeenCalled();
  });
});
