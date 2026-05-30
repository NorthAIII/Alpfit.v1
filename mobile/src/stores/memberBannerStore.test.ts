import { useMemberBannerStore } from './memberBannerStore';

describe('useMemberBannerStore', () => {
  beforeEach(() => {
    useMemberBannerStore.getState().clear();
  });

  it('başlangıçta banner gösterilmez', () => {
    expect(useMemberBannerStore.getState().programChangedBanner).toBeNull();
  });

  it('showBanner → programId set edilir', () => {
    useMemberBannerStore.getState().showBanner('prog-1');
    expect(useMemberBannerStore.getState().programChangedBanner).toBe('prog-1');
  });

  it('hideBanner → null olur', () => {
    useMemberBannerStore.getState().showBanner('prog-1');
    useMemberBannerStore.getState().hideBanner();
    expect(useMemberBannerStore.getState().programChangedBanner).toBeNull();
  });

  it('clear → null olur', () => {
    useMemberBannerStore.getState().showBanner('prog-1');
    useMemberBannerStore.getState().clear();
    expect(useMemberBannerStore.getState().programChangedBanner).toBeNull();
  });

  it('farklı programId ile showBanner → son id geçerli', () => {
    useMemberBannerStore.getState().showBanner('prog-1');
    useMemberBannerStore.getState().showBanner('prog-2');
    expect(useMemberBannerStore.getState().programChangedBanner).toBe('prog-2');
  });
});
