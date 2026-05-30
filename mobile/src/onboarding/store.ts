// Onboarding akış state'i (TASK-1.26). index → telefon → OTP → KVKK → profil
// boyunca taşınan dar bir state: kullanıcının hangi akışta olduğu (rol seçimi
// ya da davet linki), varsa davet kodu, sonradan telefon. Navigation param
// zinciri yerine merkezi store seçildi (kullanıcı onayı, 2026-05-30) — çok
// adımlı akışta param taşımak dağınıklaşıyordu.
//
// Sınır: bu store yalnızca onboarding SÜRECİNİN geçici verisini tutar; kalıcı
// oturum/token state'i (30 gün cihaz hatırlama, access/refresh) buraya değil,
// auth task'larında (TASK-1.33 auto-login) kurulacak ayrı bir katmana aittir.

import { create } from 'zustand';

/**
 * Akış tipi:
 *  - `pt`                 → "Antrenörüm" butonu; PT auth akışı.
 *  - `member`             → "Üyeyim" butonu; davetsiz üye auth akışı.
 *  - `member_via_invite`  → geçerli davet kodu (manuel giriş ya da deep link);
 *                           üye auth + onboarding sonunda PT'ye otomatik bağlanma.
 */
export type OnboardingFlow = 'pt' | 'member' | 'member_via_invite';

export interface OnboardingState {
  // exactOptionalPropertyTypes açık: alanlar reset/selectRole'da `undefined`'a
  // set edildiği için açık `| undefined` union'ı (opsiyonel `?` değil) gerekir.
  /** Seçilen akış; ekran ilk açıldığında henüz seçim yapılmamıştır. */
  flow: OnboardingFlow | undefined;
  /** Yalnızca `member_via_invite` akışında dolu — kabul edilecek davet kodu. */
  invitationCode: string | undefined;
  /** Telefon ekranında doldurulur; OTP ekranı bunu kullanır. */
  phone: string | undefined;

  /** "Üyeyim" / "Antrenörüm" rol seçimi — davet kodu temizlenir. */
  selectRole: (role: 'pt' | 'member') => void;
  /** Geçerli davet kodu (manuel ya da deep link) → `member_via_invite` akışı. */
  selectInvite: (code: string) => void;
  /** Telefon ekranından numara kaydı. */
  setPhone: (phone: string) => void;
  /** Akışı baştan başlat (çıkış / iptal / yeniden onboarding). */
  reset: () => void;
}

const initialState: Pick<OnboardingState, 'flow' | 'invitationCode' | 'phone'> = {
  flow: undefined,
  invitationCode: undefined,
  phone: undefined,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  selectRole: (role) => set({ flow: role, invitationCode: undefined }),
  selectInvite: (code) => set({ flow: 'member_via_invite', invitationCode: code }),
  setPhone: (phone) => set({ phone }),
  reset: () => set({ ...initialState }),
}));
