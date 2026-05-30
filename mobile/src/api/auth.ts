// Auth API istemcisi (TASK-1.27). Şimdilik tek public endpoint: OTP gönderimi.
// `getApiBaseUrl` davet istemcisinden yeniden kullanılır (genel client katmanı
// henüz yok — TASK-1.25 notu: sonraki auth task'ları kurunca ortak modüle taşınır).

import { getApiBaseUrl } from './invitations';

/**
 * `POST /auth/otp/send` (TASK-1.18) cevabının UI'nin tüketebileceği ayrık eşlemi.
 * Telefon varlığı send aşamasında SIZDIRILMAZ (yeni/mevcut ayrımı verify'de) —
 * bu yüzden burada "kayıtlı mı" bilgisi yok, sadece gönderim sonucu.
 */
export type OtpSendResult =
  | { kind: 'sent'; expiresInSec: number }
  | { kind: 'invalid_phone' }
  | { kind: 'rate_limited'; retryAfterSec: number }
  | { kind: 'network' };

interface SendOkBody {
  success: boolean;
  expiresInSec: number;
}

const DEFAULT_RETRY_AFTER_SEC = 60;

/**
 * E.164 telefon için OTP gönderimi tetikler. Ağ/parse hatası `network` döner
 * (ekran "tekrar dene" gösterir). Sunucu durumları HTTP koduna göre map'lenir:
 *   - 200            → sent (`expiresInSec`)
 *   - 400            → invalid_phone (server-side son savunma; UI inline zaten eler)
 *   - 429            → rate_limited (`Retry-After` header → countdown)
 */
export async function sendOtp(e164: string): Promise<OtpSendResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: e164 }),
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const body = (await res.json()) as SendOkBody;
      return { kind: 'sent', expiresInSec: body.expiresInSec };
    } catch {
      return { kind: 'network' };
    }
  }

  if (res.status === 400) {
    return { kind: 'invalid_phone' };
  }
  if (res.status === 429) {
    const header = Number(res.headers.get('Retry-After'));
    const retryAfterSec = Number.isFinite(header) && header > 0 ? header : DEFAULT_RETRY_AFTER_SEC;
    return { kind: 'rate_limited', retryAfterSec };
  }
  return { kind: 'network' };
}
