// Bildirim tercihleri backend API istemcisi (TASK-3.12).
// Backend endpoint'leri: GET /notification-preferences, PATCH /notification-preferences.
// Yalnızca member rolü erişebilir — backend 403 döndürür trainer için.

import { authedFetch } from './client';

export interface NotificationPreferences {
  reminderEnabled: boolean;
  comebackEnabled: boolean;
  systemEnabled: boolean;
  morningHour: number;
  morningMinute: number;
}

/**
 * Üyenin bildirim tercihlerini getirir. Backend yoksa default oluşturup döner (upsert).
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await authedFetch('/notification-preferences');
  if (!res.ok) {
    throw new Error(`GET /notification-preferences ${res.status}`);
  }
  return res.json() as Promise<NotificationPreferences>;
}

/**
 * Bildirim tercihlerini kısmi güncelleme yapar. Patch edilmemiş alanlar değişmez.
 */
export async function patchNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await authedFetch('/notification-preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`PATCH /notification-preferences ${res.status}`);
  }
  return res.json() as Promise<NotificationPreferences>;
}
