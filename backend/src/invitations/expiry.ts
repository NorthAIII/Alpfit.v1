/**
 * Davet linki lazy expiry helper (TASK-1.23).
 *
 * Davet 30 gün içinde kullanılmazsa otomatik iptal olur (F1.1). Bu **cron'suz**
 * çözülür (discuss-phase kararı, DECISIONS "TASK-1.23"): süre dolması yalnızca
 * davet **okunduğu anda** (liste sorgusu / TASK-1.24 accept) tespit edilir ve
 * status `pending` → `expired`'a çekilir. Böylece arka plan job'ı gerekmez;
 * süresi dolan davet hiçbir zaman aktifmiş gibi davranmaz.
 *
 * Atomiklik: update `WHERE status = 'pending'` koşuludur — eşzamanlı bir accept
 * (TASK-1.24) daveti `accepted`'a çekmişse expire onu ezmez (compare-and-set).
 */
import type { PrismaClient } from '../db/prisma.js';
import type { InvitationStatus } from '../generated/prisma/enums.js';

/** `invitation.updateMany` arayüzünü taşıyan minimal yapısal tip (tx uyumlu). */
export type InvitationClient = Pick<PrismaClient, 'invitation'>;

/** Lazy expiry kontrolü için gereken minimal davet alanları. */
export interface ExpirableInvitation {
  id: string;
  status: InvitationStatus;
  expiresAt: Date;
}

/**
 * Davet pending ve `expiresAt < now` ise status'ü `expired`'a çeker ve `true`
 * döner. Aksi halde dokunmaz, `false` döner. Update yalnızca hâlâ pending olan
 * satırı hedefler (eşzamanlı accept'i ezmez).
 */
export async function markIfExpired(
  client: InvitationClient,
  invitation: ExpirableInvitation,
): Promise<boolean> {
  if (invitation.status !== 'pending' || invitation.expiresAt.getTime() > Date.now()) {
    return false;
  }
  await client.invitation.updateMany({
    where: { id: invitation.id, status: 'pending' },
    data: { status: 'expired' },
  });
  return true;
}
