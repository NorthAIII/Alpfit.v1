// useProgramChangedBanner hook testi (TASK-2.14).
// AsyncStorage mock (jest.config moduleNameMapper) + useMemberBannerStore doğrudan kullanılır.
// Her testten önce store ve AsyncStorage sıfırlanır (setup.ts afterEach).

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMemberBannerStore } from '../stores/memberBannerStore';

import { useProgramChangedBanner } from './useMemberHome';

import type { Program } from '../api/programs';

const BASE_PROGRAM: Program = {
  id: 'prog-1',
  trainerId: 't-1',
  memberId: 'm-1',
  status: 'active',
  days: [],
  publishedAt: '2026-06-01T00:00:00.000Z',
  archivedAt: null,
  hasUnreadUpdate: false,
};

function makeProgram(overrides: Partial<Program>): Program {
  return { ...BASE_PROGRAM, ...overrides };
}

describe('useProgramChangedBanner', () => {
  beforeEach(() => {
    useMemberBannerStore.getState().clear();
  });

  it('hasUnreadUpdate false ise banner gösterilmez', async () => {
    const program = makeProgram({ hasUnreadUpdate: false });
    const { result } = renderHook(() => useProgramChangedBanner(program));
    await waitFor(() => {
      // hasUnreadUpdate false → hideBanner çağrılır, isShowing false kalır
      expect(result.current.isShowing).toBe(false);
    });
  });

  it('hasUnreadUpdate true ve daha önce dismiss edilmemişse banner gösterilir', async () => {
    const program = makeProgram({ hasUnreadUpdate: true });
    const { result } = renderHook(() => useProgramChangedBanner(program));
    await waitFor(() => {
      expect(result.current.isShowing).toBe(true);
    });
  });

  it('program null ise banner gösterilmez', async () => {
    const { result } = renderHook(() => useProgramChangedBanner(null));
    await waitFor(() => {
      expect(result.current.isShowing).toBe(false);
    });
  });

  it('dismiss sonrası aynı programId + aynı publishedAt → banner tekrar çıkmaz', async () => {
    const program = makeProgram({ hasUnreadUpdate: true });
    const { result, rerender } = renderHook(() => useProgramChangedBanner(program));

    await waitFor(() => expect(result.current.isShowing).toBe(true));

    // Kullanıcı kapatır
    await act(async () => {
      await result.current.handleDismiss();
    });

    expect(result.current.isShowing).toBe(false);

    // Store sıfırla ama AsyncStorage'da dismiss kaydı kalsın
    useMemberBannerStore.getState().clear();

    // Hook yeniden mount edilirse (app yeniden açılış simülasyonu)
    const { result: result2 } = renderHook(() => useProgramChangedBanner(program));
    await waitFor(() => {
      // Dismiss kaydı AsyncStorage'da var → tekrar gösterilmez
      expect(result2.current.isShowing).toBe(false);
    });

    void rerender;
  });

  it('yeni publish (publishedAt ilerler) sonrası dismiss kaydı geçersiz → banner tekrar çıkar', async () => {
    const program = makeProgram({ hasUnreadUpdate: true, publishedAt: '2026-06-01T00:00:00.000Z' });
    const { result } = renderHook(() => useProgramChangedBanner(program));

    await waitFor(() => expect(result.current.isShowing).toBe(true));

    await act(async () => {
      await result.current.handleDismiss();
    });

    expect(result.current.isShowing).toBe(false);

    // Store sıfırla → app yeniden açılış simülasyonu ile daha yeni publishedAt
    useMemberBannerStore.getState().clear();
    const newProgram = makeProgram({
      hasUnreadUpdate: true,
      publishedAt: '2026-06-02T00:00:00.000Z', // PT yeni publish etti
    });
    const { result: result2 } = renderHook(() => useProgramChangedBanner(newProgram));

    await waitFor(() => {
      // Yeni publish → eski dismiss geçersiz → banner tekrar görünür
      expect(result2.current.isShowing).toBe(true);
    });
  });
});
