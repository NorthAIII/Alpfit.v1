import { act, renderHook } from '@testing-library/react-native';
import * as mockReact from 'react';

import * as trainersApi from '../api/trainers';

import { useBannerStore } from './banner-store';
import { POLL_INTERVAL_MS, usePtEvents } from './use-pt-events';

// listPtEvents mock'lanır (deterministik). useFocusEffect → useEffect'e indirgenir
// (focus = mount, blur = unmount/cleanup) — gerçek navigasyon focus'u test edilmez.
jest.mock('../api/trainers', () => ({ listPtEvents: jest.fn() }));
jest.mock('expo-router', () => {
  const useFocusEffectMock = (cb: () => void) => mockReact.useEffect(cb, [cb]);
  return { useFocusEffect: useFocusEffectMock };
});

const api = jest.mocked(trainersApi);

const event = {
  type: 'invitation_accepted' as const,
  memberId: 'm1',
  memberFirstName: 'Ayşe',
  occurredAt: '2026-05-30T10:00:00.000Z',
};

describe('usePtEvents', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useBannerStore.getState().clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('interval dolunca poll tetikler (ilk poll hemen değil)', async () => {
    api.listPtEvents.mockResolvedValue({ kind: 'ok', events: [] });
    renderHook(() => usePtEvents({ accessToken: 'acc-1' }));

    // Mount anında değil — interval sonrası.
    expect(api.listPtEvents).not.toHaveBeenCalled();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(api.listPtEvents).toHaveBeenCalledTimes(1);
    expect(api.listPtEvents).toHaveBeenCalledWith('acc-1', expect.any(String));
  });

  it('yeni event → banner kuyruğuna eklenir + onNewEvents çağrılır', async () => {
    api.listPtEvents.mockResolvedValue({ kind: 'ok', events: [event] });
    const onNewEvents = jest.fn();
    renderHook(() => usePtEvents({ accessToken: 'acc-1', onNewEvents }));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(onNewEvents).toHaveBeenCalledWith([event]);
    expect(useBannerStore.getState().visible).toHaveLength(1);
    expect(useBannerStore.getState().visible[0]?.memberFirstName).toBe('Ayşe');
  });

  it('blur (unmount) sonrası poll durur', async () => {
    api.listPtEvents.mockResolvedValue({ kind: 'ok', events: [] });
    const { unmount } = renderHook(() => usePtEvents({ accessToken: 'acc-1' }));

    unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });
    expect(api.listPtEvents).not.toHaveBeenCalled();
  });

  it('token yoksa poll kurulmaz', async () => {
    renderHook(() => usePtEvents({ accessToken: undefined }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });
    expect(api.listPtEvents).not.toHaveBeenCalled();
  });
});
