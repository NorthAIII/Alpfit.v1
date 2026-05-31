// Push token backend API istemcisi (TASK-3.11).
// Backend endpoint'leri: POST /push-tokens, DELETE /push-tokens/:token.

import { authedFetch } from './client';

export type PushPlatform = 'ios' | 'android';

/**
 * Expo push token'ı backend'e kaydeder. İdempotent — aynı token tekrar
 * gönderilirse backend upsert yapar, hata vermez.
 */
export async function registerPushToken(token: string, platform: PushPlatform): Promise<void> {
  await authedFetch('/push-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  });
}

/**
 * Bu cihazın push token'ını backend'den siler. Çıkış sırasında çağrılır.
 * Ağ/sunucu hatası sessizce yutulur — çıkış akışını engellememeli.
 */
export async function deletePushToken(token: string): Promise<void> {
  try {
    await authedFetch(`/push-tokens/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
  } catch {
    // Sessizce devam — token silinememesi kritik değil; backend expire'da temizler.
  }
}
