import { useOnboardingStore } from './store';

// Store singleton — her testten önce başlangıç durumuna döndür.
beforeEach(() => {
  useOnboardingStore.getState().reset();
});

describe('useOnboardingStore', () => {
  it('başlangıçta flow/invitationCode/phone tanımsız', () => {
    const s = useOnboardingStore.getState();
    expect(s.flow).toBeUndefined();
    expect(s.invitationCode).toBeUndefined();
    expect(s.phone).toBeUndefined();
  });

  it("selectRole('member') flow'u member yapar", () => {
    useOnboardingStore.getState().selectRole('member');
    expect(useOnboardingStore.getState().flow).toBe('member');
  });

  it("selectRole('pt') flow'u pt yapar", () => {
    useOnboardingStore.getState().selectRole('pt');
    expect(useOnboardingStore.getState().flow).toBe('pt');
  });

  it('selectRole önceki davet kodunu temizler', () => {
    useOnboardingStore.getState().selectInvite('ABC123');
    useOnboardingStore.getState().selectRole('member');
    const s = useOnboardingStore.getState();
    expect(s.flow).toBe('member');
    expect(s.invitationCode).toBeUndefined();
  });

  it('selectInvite flow=member_via_invite + kodu kaydeder', () => {
    useOnboardingStore.getState().selectInvite('ABC123');
    const s = useOnboardingStore.getState();
    expect(s.flow).toBe('member_via_invite');
    expect(s.invitationCode).toBe('ABC123');
  });

  it('setPhone telefonu kaydeder', () => {
    useOnboardingStore.getState().setPhone('+905551112233');
    expect(useOnboardingStore.getState().phone).toBe('+905551112233');
  });

  it('reset tüm alanları başlangıca döndürür', () => {
    const s = useOnboardingStore.getState();
    s.selectInvite('ABC123');
    s.setPhone('+905551112233');
    s.reset();
    const after = useOnboardingStore.getState();
    expect(after.flow).toBeUndefined();
    expect(after.invitationCode).toBeUndefined();
    expect(after.phone).toBeUndefined();
  });
});
