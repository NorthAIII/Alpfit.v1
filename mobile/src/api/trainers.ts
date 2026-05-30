// Trainer API istemcisi (TASK-1.31). PT "Üyeler" sekmesinin "Aktif üyeler"
// listesini besler. `getApiBaseUrl` davet istemcisinden yeniden kullanılır
// (genel client katmanı henüz yok — TASK-1.25 notu).

import { getApiBaseUrl } from './invitations';

/** Aktif üye satırı — backend `GET /trainers/me/members` cevabının eşlemi. */
export interface TrainerMemberItem {
  id: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
}

/** `GET /trainers/me/members` sonucunun UI'nin tüketebileceği ayrık eşlemi. */
export type ListMembersResult =
  | { kind: 'ok'; members: TrainerMemberItem[] }
  | { kind: 'unauthorized' }
  | { kind: 'network' };

/**
 * PT'nin aktif üyelerini çeker (trainer access token gerekir).
 *   - 200 → ok (üye listesi; boş olabilir)
 *   - 401/403 → unauthorized (oturum geçersiz / trainer değil)
 *   - diğer / parse / ağ → network
 */
export async function listMembers(accessToken: string): Promise<ListMembersResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/trainers/me/members`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const members = (await res.json()) as TrainerMemberItem[];
      return { kind: 'ok', members };
    } catch {
      return { kind: 'network' };
    }
  }
  if (res.status === 401 || res.status === 403) {
    return { kind: 'unauthorized' };
  }
  return { kind: 'network' };
}

// --- PT in-app event akışı (TASK-1.32) ------------------------------------------
// "Üyeler" sekmesi açıkken `use-pt-events` hook'u bu endpoint'i 20sn aralıkla
// poll eder; üye davet kabul ettiğinde in-app banner + liste tazeleme tetiklenir.
// Push altyapısı (APNs/FCM) M4'te kurulunca polling SSE/push'a taşınır.

/** PT event'i — backend `GET /trainers/me/events` cevabının eşlemi (tek tip: davet kabul). */
export interface PtEvent {
  type: 'invitation_accepted';
  memberId: string;
  memberFirstName: string;
  occurredAt: string;
}

/** `GET /trainers/me/events` sonucunun UI eşlemi. */
export type ListPtEventsResult =
  | { kind: 'ok'; events: PtEvent[] }
  | { kind: 'unauthorized' }
  | { kind: 'network' };

/**
 * PT'nin `since`'ten sonra oluşan event'lerini çeker (trainer access token).
 * `since` istemcinin en son gördüğü `occurredAt`'tır (ilk poll'da hook mount
 * anını geçirir). Backend strict `>` uygular; istemci ayrıca dedup eder.
 *   - 200 → ok (event listesi; boş olabilir)
 *   - 401/403 → unauthorized
 *   - diğer / parse / ağ → network (hook backoff uygular)
 */
export async function listPtEvents(
  accessToken: string,
  since: string,
): Promise<ListPtEventsResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/trainers/me/events?since=${encodeURIComponent(since)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const events = (await res.json()) as PtEvent[];
      return { kind: 'ok', events };
    } catch {
      return { kind: 'network' };
    }
  }
  if (res.status === 401 || res.status === 403) {
    return { kind: 'unauthorized' };
  }
  return { kind: 'network' };
}
