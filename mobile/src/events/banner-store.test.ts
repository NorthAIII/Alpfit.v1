import { MAX_VISIBLE, useBannerStore } from './banner-store';

import type { PtEvent } from '../api/trainers';

function event(memberId: string, occurredAt: string, firstName = 'Üye'): PtEvent {
  return { type: 'invitation_accepted', memberId, memberFirstName: firstName, occurredAt };
}

describe('useBannerStore', () => {
  beforeEach(() => {
    useBannerStore.getState().clear();
  });

  it('enqueue → görünür banner ekler (kararlı id = memberId:occurredAt)', () => {
    useBannerStore.getState().enqueue([event('m1', '2026-05-30T10:00:00.000Z', 'Ayşe')]);
    const { visible } = useBannerStore.getState();
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe('m1:2026-05-30T10:00:00.000Z');
    expect(visible[0]?.memberFirstName).toBe('Ayşe');
  });

  it('aynı event iki kez enqueue → tek banner (dedup)', () => {
    const e = event('m1', '2026-05-30T10:00:00.000Z');
    useBannerStore.getState().enqueue([e]);
    useBannerStore.getState().enqueue([e]);
    expect(useBannerStore.getState().visible).toHaveLength(1);
  });

  it('dismiss → tek banner kapanır (dedup korunur, tekrar açılmaz)', () => {
    const e = event('m1', '2026-05-30T10:00:00.000Z');
    useBannerStore.getState().enqueue([e]);
    useBannerStore.getState().dismiss('m1:2026-05-30T10:00:00.000Z');
    expect(useBannerStore.getState().visible).toHaveLength(0);
    // Aynı event yeniden gelse bile gösterilmez (seenIds).
    useBannerStore.getState().enqueue([e]);
    expect(useBannerStore.getState().visible).toHaveLength(0);
  });

  it('MAX_VISIBLE aşılırsa fazlası overflow sayacına düşer', () => {
    const events = Array.from({ length: MAX_VISIBLE + 3 }, (_, i) =>
      event(`m${i}`, `2026-05-30T10:00:0${i}.000Z`),
    );
    useBannerStore.getState().enqueue(events);
    expect(useBannerStore.getState().visible).toHaveLength(MAX_VISIBLE);
    expect(useBannerStore.getState().overflow).toBe(3);
  });
});
