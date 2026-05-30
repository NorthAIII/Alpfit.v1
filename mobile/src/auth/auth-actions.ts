// Oturum yaşam döngüsü eylemleri (TASK-1.33). Giriş anında kalıcılaştırma
// (`persistLogin`) ve app açılışta otomatik oturum geri yükleme
// (`bootstrapSession`). HTTP primitifleri `api/client.ts`'te; burada akış
// orkestrasyonu var.

import { fetchMe, refreshAccessToken, requestMe } from '../api/client';

import { useSessionStore, type SessionRole } from './session';
import { saveAuth } from './storage';

interface LoginTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Başarılı girişte (OTP login ya da profil create) jetonları kalıcılaştırır:
 * refresh token + rol secure storage'a yazılır, bellek store'u doldurulur.
 * Bundan sonra app kapanıp açılsa bile `bootstrapSession` oturumu geri yükler.
 *
 * `role` biliniyorsa (profil create akışı: member/trainer seçili) doğrudan
 * kullanılır. Bilinmiyorsa (mevcut kullanıcı OTP girişi — verify rol döndürmez)
 * `GET /auth/me` ile öğrenilir. Rol çözülemezse `null` döner (çağıran girişi
 * tamamlamaz, hata gösterir).
 */
export async function persistLogin(
  tokens: LoginTokens,
  role?: SessionRole,
): Promise<SessionRole | null> {
  let resolvedRole = role;
  if (resolvedRole === undefined) {
    const me = await requestMe(tokens.accessToken);
    if (me.kind !== 'ok') {
      return null;
    }
    resolvedRole = me.user.role;
  }

  await saveAuth({ refreshToken: tokens.refreshToken, role: resolvedRole });
  useSessionStore.getState().setSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    role: resolvedRole,
  });
  return resolvedRole;
}

/**
 * Giriş sonrası role göre ana ekran yolu. Trainer "Üyeler" sekmesine (tab
 * grubu URL'de görünmez → `/members`), member home placeholder'ına gider.
 * Gym Owner v1'de yok (rol enum'da slot var ama auth akışında üretilmez).
 */
export function homePathForRole(role: SessionRole): '/members' | '/home' {
  return role === 'trainer' ? '/members' : '/home';
}

/** App açılış sonucu — köke (landing) mi yoksa role göre ana ekrana mı gidilecek. */
export type BootResult = { kind: 'authenticated'; role: SessionRole } | { kind: 'unauthenticated' };

/**
 * App açılışta oturumu geri yüklemeye çalışır (30 gün cihaz hatırlama):
 *   1. Secure storage'da refresh token yoksa → unauthenticated (onboarding).
 *   2. `POST /auth/refresh` ile yeni access + refresh al (rotation). Token
 *      geçersiz/expired/replay ise refresh akışı oturumu temizler → unauthenticated.
 *   3. `GET /auth/me` ile doğrula + güncel rolü al. Tutarsızlıkta temizle.
 *
 * `refreshAccessToken` başarılıysa session store'u zaten doldurmuştur; burada
 * yalnızca yönlendirme kararı (rol) döner.
 */
export async function bootstrapSession(): Promise<BootResult> {
  const accessToken = await refreshAccessToken();
  if (accessToken === null) {
    return { kind: 'unauthenticated' };
  }

  const me = await fetchMe();
  if (me.kind !== 'ok') {
    // Refresh başarılı (token geçerli) ama profil alınamadı → muhtemelen ağ
    // blip'i. Bellek oturumunu boşalt, onboarding'e düş; secure storage KORUNUR
    // (sonraki açılış yeniden dener, kullanıcıyı re-login'e zorlamayız).
    useSessionStore.getState().clear();
    return { kind: 'unauthenticated' };
  }

  return { kind: 'authenticated', role: me.user.role };
}
