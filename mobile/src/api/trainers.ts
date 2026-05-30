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
