// Oturum (session) state'i — bellek-içi (TASK-1.31). OTP verify / profil create
// dönüşündeki access + refresh jetonunu ve rolü tutar; PT "Üyeler" sekmesi gibi
// authenticated ekranlar buradan access token okur.
//
// Sınır: bu store şimdilik YALNIZCA bellekte tutar. Kalıcı saklama (SecureStore,
// 30 gün cihaz hatırlama), auto-login ve auth-gate'li yönlendirme TASK-1.33'te
// bu store'un ÜZERİNE eklenir — onboarding store'dan ayrıdır (o onboarding
// SÜRECİNİN geçici verisini, bu kalıcı oturumu temsil eder).

import { create } from 'zustand';

export type SessionRole = 'member' | 'trainer';

export interface SessionState {
  // exactOptionalPropertyTypes açık: clear()'da `undefined`'a set edildiği için
  // açık `| undefined` union'ı (opsiyonel `?` değil) gerekir.
  accessToken: string | undefined;
  refreshToken: string | undefined;
  role: SessionRole | undefined;

  /** Giriş başarılı olduğunda jetonları + rolü saklar. */
  setSession: (session: { accessToken: string; refreshToken: string; role: SessionRole }) => void;
  /** Çıkış / oturum sıfırlama. */
  clear: () => void;
}

const initialState: Pick<SessionState, 'accessToken' | 'refreshToken' | 'role'> = {
  accessToken: undefined,
  refreshToken: undefined,
  role: undefined,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSession: ({ accessToken, refreshToken, role }) => set({ accessToken, refreshToken, role }),
  clear: () => set({ ...initialState }),
}));
