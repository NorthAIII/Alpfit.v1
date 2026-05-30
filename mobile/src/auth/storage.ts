// Kalıcı oturum saklama (TASK-1.33). Refresh token + rol iOS Keychain / Android
// Keystore üzerinde OS-seviyesinde şifreli tutulur (`expo-secure-store`). 30 gün
// cihaz hatırlama bunun üzerine kurulur: app açılışta refresh token varsa
// `POST /auth/refresh` ile oturum geri yüklenir (bkz. auth-actions.ts).
//
// SAKLANAN: yalnızca refresh token + rol. Access token SAKLANMAZ — kısa ömürlü
// (15dk JWT), her boot'ta refresh ile yeniden alınır, bellekte (session store)
// kalır. Gerekçe: Keychain item başına ~512 byte sınırı + access token
// kaybedilse de düşük risk (TASK-1.33 Dikkat Noktaları / Karar Noktaları).
//
// Biometric (Face/Touch ID) KAPALI: `requireAuthentication` set edilmez — v1'de
// her açılışta biometric istemek UX sürtünmesi; opsiyonel feature Yakın 5+.

import * as SecureStore from 'expo-secure-store';

import type { SessionRole } from './session';

// Anahtarlar nokta-namespace'li; ileride başka secure değer eklenirse `auth.*`
// altında gruplanır. (iOS Keychain service + Android keystore alias bunlardan türer.)
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const ROLE_KEY = 'auth.role';

/** Cihazda kalıcı tutulan oturum verisi (refresh token + rol). */
export interface StoredAuth {
  refreshToken: string;
  role: SessionRole;
}

function isSessionRole(value: string | null): value is SessionRole {
  return value === 'member' || value === 'trainer';
}

/** Refresh token + rolü secure storage'a yazar (giriş ve her rotation sonrası). */
export async function saveAuth(auth: StoredAuth): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.refreshToken);
  await SecureStore.setItemAsync(ROLE_KEY, auth.role);
}

/**
 * Saklı oturumu okur. İkisinden biri eksik/bozuksa (ör. kısmi yazım, manuel
 * temizleme) `null` döner — çağıran bunu "oturum yok" sayar, baştan onboarding.
 */
export async function loadAuth(): Promise<StoredAuth | null> {
  const [refreshToken, role] = await Promise.all([
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(ROLE_KEY),
  ]);
  if (refreshToken === null || refreshToken.length === 0 || !isSessionRole(role)) {
    return null;
  }
  return { refreshToken, role };
}

/** Saklı oturumu siler (çıkış, refresh başarısızlığı, replay tespiti). */
export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
}
