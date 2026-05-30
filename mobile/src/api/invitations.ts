// Davet API istemcisi (TASK-1.25). Henüz genel bir API client katmanı yok;
// deep link ekranının ihtiyacı olan tek public endpoint burada izole edilir.
// Sonraki auth task'ları (TASK-1.26+) genel client'ı kurunca buraya taşınır.

import Constants from 'expo-constants';

/**
 * Backend base URL'i. app.config.ts `extra.apiBaseUrl`'i
 * `EXPO_PUBLIC_API_BASE_URL`'den besler. Yoksa (test/dev) localhost'a düşer —
 * MSW testte host-agnostic wildcard ile yakaladığı için değer önemli değil.
 */
export function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.['apiBaseUrl'];
  return typeof fromExtra === 'string' && fromExtra.length > 0
    ? fromExtra
    : 'http://localhost:3000';
}

/** Davet ön bilgisi sonucu — backend `GET /invitations/:code` cevabının eşlemi. */
export type InvitationPreviewResult =
  | { kind: 'valid'; trainerFirstName: string; trainerLastName: string; expiresAt: string }
  | { kind: 'not_found' }
  | { kind: 'expired' }
  | { kind: 'cancelled' }
  | { kind: 'used' }
  | { kind: 'network' };

interface PreviewOkBody {
  trainerFirstName: string;
  trainerLastName: string;
  expiresAt: string;
}

interface PreviewErrorBody {
  status?: string;
}

/**
 * `GET /invitations/:code` çağırır ve UI'nin doğrudan tüketebileceği ayrık
 * (discriminated) sonuca map'ler. Ağ/parse hatası `network` olarak döner
 * (ekran "tekrar dene" gösterir). Geçersizlik durumları HTTP koduna + body
 * `status` alanına göre ayrıştırılır:
 *   - 200            → valid
 *   - 404            → not_found (davet yok / PT soft-deleted)
 *   - 410 expired    → expired
 *   - 410 cancelled  → cancelled
 *   - 410 accepted   → used
 */
export async function fetchInvitationPreview(code: string): Promise<InvitationPreviewResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/invitations/${encodeURIComponent(code)}`);
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const body = (await res.json()) as PreviewOkBody;
      return {
        kind: 'valid',
        trainerFirstName: body.trainerFirstName,
        trainerLastName: body.trainerLastName,
        expiresAt: body.expiresAt,
      };
    } catch {
      return { kind: 'network' };
    }
  }

  let status: string | undefined;
  try {
    status = ((await res.json()) as PreviewErrorBody).status;
  } catch {
    status = undefined;
  }

  if (res.status === 404) {
    return { kind: 'not_found' };
  }
  if (res.status === 410) {
    if (status === 'cancelled') {
      return { kind: 'cancelled' };
    }
    if (status === 'accepted') {
      return { kind: 'used' };
    }
    return { kind: 'expired' };
  }
  return { kind: 'network' };
}
