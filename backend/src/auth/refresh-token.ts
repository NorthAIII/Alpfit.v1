/**
 * Opaque refresh token üretimi + hash + issue (TASK-1.21).
 *
 * Access token (TASK-1.20, JWT) kısa ömürlü; refresh token uzun ömürlüdür
 * (30 gün — F1.1 "cihaz hatırlama") ve **opaque**'tir: JWT değil, salt rastgele
 * `crypto.randomBytes(32)` (base64url). DB'de ham token DEĞİL, yalnızca
 * `sha256(token)` hex saklanır (`RefreshToken.tokenHash @unique`) — DB dump'ı
 * çalınsa bile token'lar kullanılamaz (DECISIONS "TASK-1.21").
 *
 * Aile (family) modeli: her **ilk login** yeni `familyId` başlatır (= bir cihaz).
 * Rotation chain aynı `familyId`'yi taşır, `previousId` ile zincirlenir. Rotation
 * + replay detection mantığı `routes/auth-refresh.ts`'tedir; bu modül yalnızca
 * üretim + DB insert sözleşmesini sağlar (verify route + profile + refresh route
 * ortak kullanır).
 */
import { createHash, randomBytes } from 'node:crypto';

import type { PrismaClient } from '../db/prisma.js';

/** Refresh token ömrü (saniye) — 30 gün (F1.1 cihaz hatırlama penceresi). */
export const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60;

/**
 * `refreshToken.create` arayüzünü taşıyan minimal yapısal tip. Hem `PrismaClient`
 * hem `$transaction` callback'ine geçen tx client bunu sağlar — profile create
 * gibi atomik akışlarda refresh token aynı transaction içinde basılabilir.
 */
export type RefreshTokenClient = Pick<PrismaClient, 'refreshToken'>;

/** `RefreshToken.deviceInfo` — PII olmayan cihaz bilgisi (analytics). */
export type DeviceInfo = Record<string, string>;

/** Ham token'ın sha256 hex özetini döner (DB'de bu saklanır, ham token değil). */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Yeni opaque refresh token üretir: 32 byte güvenli rastgele (base64url, URL-safe
 * → mobile'da güvenle taşınır) + sha256 hash. Ham `token` yalnızca response'ta
 * döner; DB'ye `tokenHash` yazılır.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashRefreshToken(token) };
}

export interface IssueRefreshTokenArgs {
  userId: string;
  /** Omit → yeni aile (ilk login). Verilirse rotation aynı aileyi sürdürür. */
  familyId?: string;
  /** Rotation chain'inde önceki token id'si (ilk login'de null). */
  previousId?: string | null;
  /** Opsiyonel cihaz bilgisi (userAgent vb.) — PII değil. */
  deviceInfo?: DeviceInfo | null;
}

export interface IssuedRefreshToken {
  /** Ham token — sadece response'ta döner, DB'de yok. */
  token: string;
  id: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Refresh token üretir ve DB'ye (hash'li) yazar. `familyId` verilmezse yeni aile
 * başlatılır (ilk login). Ham token + metadata döner; çağıran ham token'ı
 * istemciye iletir, bir daha asla göremez.
 */
export async function issueRefreshToken(
  client: RefreshTokenClient,
  args: IssueRefreshTokenArgs,
): Promise<IssuedRefreshToken> {
  const { token, tokenHash } = generateRefreshToken();
  const familyId = args.familyId ?? randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);

  const row = await client.refreshToken.create({
    data: {
      userId: args.userId,
      tokenHash,
      familyId,
      previousId: args.previousId ?? null,
      expiresAt,
      ...(args.deviceInfo == null ? {} : { deviceInfo: args.deviceInfo }),
    },
    select: { id: true, familyId: true, expiresAt: true },
  });

  return { token, id: row.id, familyId: row.familyId, expiresAt: row.expiresAt };
}

/**
 * Süresi dolmuş refresh token'ları siler ve silinen sayısını döner. Expired
 * token zaten /auth/refresh'te 401 döner; bu yalnızca DB temizliğidir
 * (nice-to-have). Coolify scheduled hook TASK-1.15 retention job'ıyla birleşik
 * kalır — bu task'ta yalnızca arayüz sağlanır, cron bağlanmaz.
 */
export async function cleanupExpiredRefreshTokens(client: RefreshTokenClient): Promise<number> {
  const { count } = await client.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
