// Authenticated API client (TASK-1.33). Üç sorumluluk:
//   1. `refreshAccessToken` — refresh token rotation çağrısı, TEK uçuş (singleton)
//      ile: eşzamanlı birden çok 401 aynı refresh'i paylaşır (rotate edilen eski
//      token tekrar tekrar gönderilmez → backend replay tespiti tetiklenmez).
//   2. `authedFetch` — access token'ı header'a ekler; 401'de bir kez refresh +
//      retry dener.
//   3. `fetchMe` — `GET /auth/me` (auto-login doğrulama + rol).
//
// Bağımlılık yönü: client → session (clearSession), session → storage. Döngü yok.

import { clearSession, useSessionStore, type SessionRole } from '../auth/session';
import { loadAuth, saveAuth } from '../auth/storage';

import { getApiBaseUrl } from './invitations';

interface RefreshOkBody {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Tek-uçuş refresh: ilk çağıran gerçek isteği başlatır, sonrakiler aynı
// promise'i bekler. Çözülünce sıfırlanır (sonraki refresh yeni token'la başlar).
let inflightRefresh: Promise<string | null> | null = null;

/**
 * Saklı refresh token ile `POST /auth/refresh` çağırır (rotation). Başarılıysa
 * yeni access + refresh token'ı hem secure storage'a hem bellek store'una yazar
 * ve yeni access token'ı döner.
 *
 *   - Saklı token yok / parse-ağ hatası → `null` (oturum SİLİNMEZ; ağ geçici
 *     olabilir, saklı token korunur).
 *   - HTTP 401 (invalid/expired/replay) → oturum tamamen silinir (`clearSession`)
 *     ve `null` döner — kullanıcı yeniden giriş yapmalı.
 *
 * Eşzamanlı çağrılar tek `inflightRefresh` promise'ini paylaşır.
 */
export function refreshAccessToken(): Promise<string | null> {
  inflightRefresh ??= doRefresh().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

async function doRefresh(): Promise<string | null> {
  const stored = await loadAuth();
  if (stored === null) {
    return null;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });
  } catch {
    return null; // Ağ hatası: geçici olabilir, saklı token'ı koru.
  }

  if (res.status === 401) {
    // Token geçersiz/expired/replay → oturumu temizle, yeniden giriş gerek.
    await clearSession();
    return null;
  }
  if (!res.ok) {
    return null;
  }

  let body: RefreshOkBody;
  try {
    body = (await res.json()) as RefreshOkBody;
  } catch {
    return null;
  }

  await saveAuth({ refreshToken: body.refreshToken, role: stored.role });
  useSessionStore.getState().setSession({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    role: stored.role,
  });
  return body.accessToken;
}

function withAuth(init: RequestInit | undefined, token: string | undefined): RequestInit {
  const headers = new Headers(init?.headers);
  if (token !== undefined) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
}

/**
 * Access token'ı header'a ekleyerek istek atar. 401 dönerse bir kez refresh +
 * retry dener; refresh de başarısızsa orijinal 401 yanıtı döner (bu durumda
 * `refreshAccessToken` oturumu zaten temizlemiştir, çağıran onboarding'e gider).
 *
 * `path` baştaki `/` ile verilir (ör. `/auth/me`).
 */
export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getApiBaseUrl()}${path}`;
  const token = useSessionStore.getState().accessToken;

  const res = await fetch(url, withAuth(init, token));
  if (res.status !== 401) {
    return res;
  }

  const newToken = await refreshAccessToken();
  if (newToken === null) {
    return res; // Refresh başarısız: 401'i geri ver (oturum temizlendi).
  }
  return fetch(url, withAuth(init, newToken));
}

/** `GET /auth/me` cevabındaki kullanıcı (auto-login doğrulama + rol + profil). */
export interface MeUser {
  id: string;
  role: SessionRole;
  firstName: string;
  lastName: string;
  phoneE164: string;
  gymName: string | null;
  certificateNote: string | null;
}

/** `fetchMe` sonucunun ayrık eşlemi. */
export type FetchMeResult =
  | { kind: 'ok'; user: MeUser }
  | { kind: 'unauthorized' }
  | { kind: 'network' };

function mapMeResponse(res: Response): Promise<FetchMeResult> {
  if (res.ok) {
    return res
      .json()
      .then((body) => ({ kind: 'ok' as const, user: (body as { user: MeUser }).user }))
      .catch(() => ({ kind: 'network' as const }));
  }
  if (res.status === 401) {
    return Promise.resolve({ kind: 'unauthorized' as const });
  }
  return Promise.resolve({ kind: 'network' as const });
}

/**
 * Oturum sahibinin profilini çeker (`authedFetch` → 401'de refresh dener).
 * Auto-login akışında (store + refresh hazırken) kullanılır.
 */
export async function fetchMe(): Promise<FetchMeResult> {
  let res: Response;
  try {
    res = await authedFetch('/auth/me');
  } catch {
    return { kind: 'network' };
  }
  return mapMeResponse(res);
}

/**
 * `GET /auth/me`'yi açık access token ile çağırır — store/refresh'ten bağımsız.
 * Giriş anında (OTP login), store henüz set edilmeden rolü öğrenmek için
 * kullanılır (mevcut kullanıcı girişinde verify cevabı rol döndürmez).
 */
export async function requestMe(accessToken: string): Promise<FetchMeResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return { kind: 'network' };
  }
  return mapMeResponse(res);
}
