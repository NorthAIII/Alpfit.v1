// Oturum (session) state'i — bellek-içi (TASK-1.31). OTP verify / profil create
// dönüşündeki access + refresh jetonunu ve rolü tutar; PT "Üyeler" sekmesi gibi
// authenticated ekranlar buradan access token okur.
//
// TASK-1.33: bu bellek-içi store'un ÜZERİNE kalıcılık kuruldu. Refresh token + rol
// ayrıca `storage.ts` (SecureStore) ile cihazda saklanır; app açılışta
// `bootstrapSession` (auth-actions.ts) store'u geri doldurur (auto-login).
// Onboarding store'dan ayrıdır — o onboarding SÜRECİNİN geçici verisini, bu
// kalıcı oturumu temsil eder.

import { create } from 'zustand';

import { clearAuth } from './storage';

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

/**
 * Oturumu hem bellekten hem cihazdan (SecureStore) tamamen siler. Çıkış,
 * refresh başarısızlığı (expired/replay) ve auto-login doğrulama hatasında
 * çağrılır. React dışından da kullanılabilir (store.getState() pattern'i).
 */
export async function clearSession(): Promise<void> {
  await clearAuth();
  useSessionStore.getState().clear();
}
