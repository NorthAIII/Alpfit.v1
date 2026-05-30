// Auth API istemcisi (TASK-1.27, TASK-1.29). Public endpoint'ler: OTP gönderimi
// + OTP doğrulama; ayrıca dev-only OTP lookup. `getApiBaseUrl` davet
// istemcisinden yeniden kullanılır (genel client katmanı henüz yok — TASK-1.25
// notu: sonraki auth task'ları kurunca ortak modüle taşınır).

import Constants from 'expo-constants';

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

/**
 * `POST /auth/otp/verify` (TASK-1.19) cevabının UI eşlemi. Yeni vs mevcut
 * kullanıcı ayrımı BURADA ortaya çıkar (telefon girişinde değil — F1.1 sızıntı
 * önlemi):
 *   - mevcut üye → `logged_in` (access + refresh; persist TASK-1.33)
 *   - yeni üye   → `registered` (kayıt jetonu; profil POST /auth/profile, TASK-1.30)
 */
export type OtpVerifyResult =
  | { kind: 'logged_in'; accessToken: string; refreshToken: string; expiresAt: string }
  | { kind: 'registered'; registrationToken: string }
  | { kind: 'invalid_code' }
  | { kind: 'expired' }
  | { kind: 'locked'; retryAfterSec: number }
  | { kind: 'network' };

interface VerifyOkBody {
  isNew: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  registrationToken?: string;
}

/**
 * E.164 + 6 haneli kodu doğrular. HTTP koduna göre map'lenir:
 *   - 200 isNew:false → logged_in (access/refresh/expiresAt)
 *   - 200 isNew:true  → registered (registrationToken)
 *   - 401             → invalid_code (yanlış kod, deneme sayacı < 5)
 *   - 410             → expired (aktif OTP yok / süresi doldu)
 *   - 423             → locked (5 hatalı → 15dk kilit; `Retry-After` → countdown)
 *   - diğer / parse   → network
 */
export async function verifyOtp(e164: string, code: string): Promise<OtpVerifyResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: e164, code }),
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const body = (await res.json()) as VerifyOkBody;
      if (body.isNew && typeof body.registrationToken === 'string') {
        return { kind: 'registered', registrationToken: body.registrationToken };
      }
      if (
        !body.isNew &&
        typeof body.accessToken === 'string' &&
        typeof body.refreshToken === 'string' &&
        typeof body.expiresAt === 'string'
      ) {
        return {
          kind: 'logged_in',
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
          expiresAt: body.expiresAt,
        };
      }
      return { kind: 'network' };
    } catch {
      return { kind: 'network' };
    }
  }

  if (res.status === 401) {
    return { kind: 'invalid_code' };
  }
  if (res.status === 410) {
    return { kind: 'expired' };
  }
  if (res.status === 423) {
    const header = Number(res.headers.get('Retry-After'));
    const retryAfterSec = Number.isFinite(header) && header > 0 ? header : DEFAULT_LOCKOUT_SEC;
    return { kind: 'locked', retryAfterSec };
  }
  return { kind: 'network' };
}

/** 5 hatalı denemede backend 15dk kilit uygular; `Retry-After` yoksa fallback. */
const DEFAULT_LOCKOUT_SEC = 15 * 60;

/** Onboarding sonunda dönen kullanıcı özeti (`POST /auth/profile` 201 body'si). */
export interface ProfileUser {
  id: string;
  role: 'member' | 'trainer';
  firstName: string;
  lastName: string;
  phoneE164: string;
  gymName: string | null;
  certificateNote: string | null;
}

export interface CreateProfileInput {
  /** OTP verify'in "yeni üye" yolunda dönen kayıt jetonu (Bearer; `sub`=telefon). */
  registrationToken: string;
  role: 'member' | 'trainer';
  firstName: string;
  lastName: string;
  kvkkConsent: boolean;
  healthConsent: boolean;
  /** PT-only opsiyonel alanlar; boşsa gövdeye eklenmez. */
  gymName?: string;
  certificateNote?: string;
}

/**
 * `POST /auth/profile` (TASK-1.20) cevabının UI eşlemi.
 *   - 201 → created (access + refresh + user; persist TASK-1.33)
 *   - 409 → phone_taken (telefon zaten kayıtlı → giriş akışı)
 *   - 403 → kvkk_required (kvkkConsent !== true; UI normalde engeller)
 *   - 401 → unauthorized (kayıt jetonu yok/expired → baştan onboarding)
 *   - 400 → invalid (gövde şeması; UI inline zaten eler)
 */
export type CreateProfileResult =
  | {
      kind: 'created';
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
      user: ProfileUser;
    }
  | { kind: 'phone_taken' }
  | { kind: 'kvkk_required' }
  | { kind: 'unauthorized' }
  | { kind: 'invalid' }
  | { kind: 'network' };

interface CreatedBody {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: ProfileUser;
}

/**
 * Kayıt jetonuyla yeni üye/PT hesabı açar. KVKK rızaları gövdede; kod TAŞINMAZ
 * (telefon sahipliği jetondan gelir). Opsiyonel PT alanları boşsa atlanır.
 */
export async function createProfile(input: CreateProfileInput): Promise<CreateProfileResult> {
  const body: Record<string, unknown> = {
    role: input.role,
    firstName: input.firstName,
    lastName: input.lastName,
    kvkkConsent: input.kvkkConsent,
    healthConsent: input.healthConsent,
  };
  if (input.gymName) {
    body['gymName'] = input.gymName;
  }
  if (input.certificateNote) {
    body['certificateNote'] = input.certificateNote;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.registrationToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.status === 201) {
    try {
      const created = (await res.json()) as CreatedBody;
      return {
        kind: 'created',
        accessToken: created.accessToken,
        refreshToken: created.refreshToken,
        expiresAt: created.expiresAt,
        user: created.user,
      };
    } catch {
      return { kind: 'network' };
    }
  }
  if (res.status === 409) {
    return { kind: 'phone_taken' };
  }
  if (res.status === 403) {
    return { kind: 'kvkk_required' };
  }
  if (res.status === 401) {
    return { kind: 'unauthorized' };
  }
  if (res.status === 400) {
    return { kind: 'invalid' };
  }
  return { kind: 'network' };
}

/**
 * `POST /invitations/:code/accept` (TASK-1.24) cevabının UI eşlemi. Yalnızca
 * `member_via_invite` akışında, profil oluşup access jetonu alındıktan sonra
 * çağrılır. Terminal hatalar (404/410/409/...) tek `failed`'e iner — çözüm aynı:
 * PT'den yeni link iste. `network` ayrı tutulur (retry edilebilir).
 */
export type AcceptInvitationResult =
  | { kind: 'connected'; trainerFirstName: string; trainerLastName: string }
  | { kind: 'failed' }
  | { kind: 'network' };

interface AcceptOkBody {
  trainerFirstName: string;
  trainerLastName: string;
}

export async function acceptInvitation(
  code: string,
  accessToken: string,
): Promise<AcceptInvitationResult> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/invitations/${encodeURIComponent(code)}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return { kind: 'network' };
  }

  if (res.ok) {
    try {
      const body = (await res.json()) as AcceptOkBody;
      return {
        kind: 'connected',
        trainerFirstName: body.trainerFirstName,
        trainerLastName: body.trainerLastName,
      };
    } catch {
      return { kind: 'network' };
    }
  }
  // 404/410/409/400/403 → retry düzeltmez; tek terminal failure.
  return { kind: 'failed' };
}

/** Dev OTP lookup sonucu — başarısız her durum tek `unavailable`'a indirgenir. */
export type DevOtpResult = { kind: 'ok'; code: string } | { kind: 'unavailable' };

/**
 * `EXPO_PUBLIC_DEV_OTP_LOOKUP=true` ya da `__DEV__` ise OTP ekranında "Dev OTP
 * getir" butonu görünür. Production build'de gizli (endpoint zaten 404 döner).
 */
export function isDevOtpLookupEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }
  return Constants.expoConfig?.extra?.['devOtpLookup'] === true;
}

/** Internal endpoint bearer token (backend `ADMIN_INTERNAL_TOKEN` ile aynı). */
function getDevOtpToken(): string | undefined {
  const token = Constants.expoConfig?.extra?.['adminInternalToken'];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

/**
 * `GET /internal/dev-otp/:phone` (TASK-1.17) ile son OTP kodunu çeker — yalnızca
 * dev/staging. Token yoksa ya da herhangi bir hata olursa `unavailable` döner
 * (dev kolaylığı; başarısızlıkta sessizce gizlenir). Telefon PII'dir; sadece
 * URL path'inde gider, log'lanmaz.
 */
export async function fetchDevOtp(e164: string): Promise<DevOtpResult> {
  const token = getDevOtpToken();
  if (!token) {
    return { kind: 'unavailable' };
  }
  try {
    const res = await fetch(`${getApiBaseUrl()}/internal/dev-otp/${encodeURIComponent(e164)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { kind: 'unavailable' };
    }
    const body = (await res.json()) as { otpCode?: string };
    return typeof body.otpCode === 'string'
      ? { kind: 'ok', code: body.otpCode }
      : { kind: 'unavailable' };
  } catch {
    return { kind: 'unavailable' };
  }
}
