/**
 * `Authorization: Bearer <token>` başlığını ayrıştıran ortak yardımcı.
 *
 * Internal endpoint'ler (admin-internal.ts, internal-dev-otp.ts) aynı statik
 * bearer-token guard'ını paylaşır — tek kaynak burada tutulur (DRY).
 */
const BEARER_PREFIX = 'Bearer ';

/**
 * Başlıktan token'ı çıkarır. Geçerli `Bearer ` prefix'i yoksa veya token boşsa
 * `null` döner (çağıran 401 verir).
 */
export function extractBearer(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string') return null;
  if (!header.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
}
