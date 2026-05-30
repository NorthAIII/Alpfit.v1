// Üye tarafı program_changed banner store'u (TASK-2.14).
// Session-içi görünürlük durumunu tutar; dismiss persist'i AsyncStorage
// üzerinden `useProgramChangedBanner` hook'u yönetir (M4'te push'a yükseltilince
// yalnızca trigger noktası değişir, bu store ve UI aynı kalır).

import { create } from 'zustand';

interface MemberBannerState {
  /** Gösterilen banner'ın program id'si; null = gizli. */
  programChangedBanner: string | null;
  showBanner: (programId: string) => void;
  hideBanner: () => void;
  /** Çıkış / oturum sıfırlama. */
  clear: () => void;
}

export const useMemberBannerStore = create<MemberBannerState>((set) => ({
  programChangedBanner: null,
  showBanner: (programId) => set({ programChangedBanner: programId }),
  hideBanner: () => set({ programChangedBanner: null }),
  clear: () => set({ programChangedBanner: null }),
}));
