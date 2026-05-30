import { z } from 'zod';

const NODE_ENVS = ['development', 'staging', 'production'] as const;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
const SMS_PROVIDERS = ['mock', 'live'] as const;

const baseSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
  APP_ENV: z.string().min(1).default('local'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  // KVKK retention purge cron auth (TASK-1.15). Boş bırakılırsa endpoint
  // konfigürasyon hatasıyla 503 döner — cron yine de kurulmaya zorlanmaz
  // (development ve test'te env eksik olabilir).
  ADMIN_INTERNAL_TOKEN: z
    .string()
    .min(32, 'ADMIN_INTERNAL_TOKEN must be at least 32 characters')
    .optional(),
  // SMS gönderim driver'ı (TASK-1.17). `mock` (varsayılan) dev/staging'de
  // OTP'yi dev_otp_log tablosuna yazar; `live` Yakın 5'te gerçek provider'ı
  // devreye alır (o tarihe kadar factory `live`'da fail-fast eder).
  SMS_PROVIDER: z.enum(SMS_PROVIDERS).default('mock'),
  // Davet linki base URL'i (TASK-1.23). PT davet kodu bu base ile birleşip
  // `${APP_BASE_URL}/davet/{kod}` üretir. Prod: https://alpfit.app, staging:
  // https://alpfit-staging.kiwiailab.com. Trailing slash route helper'da normalize edilir.
  APP_BASE_URL: z.string().url().default('https://alpfit.app'),
  // Deep link — iOS Apple App Site Association `appID` (TASK-1.25). Format:
  // `<TeamID>.<bundleId>`. Apple Developer hesabı Yakın 5'te açılınca gerçek
  // Team ID buraya girilir (tek string değişikliği); o ana kadar placeholder.
  // bundleId mobile/app.json ile sabit: app.alpfit.mobile.
  APPLE_APP_ID: z.string().min(1).default('STAGINGTEAMID.app.alpfit.mobile'),
  // Deep link — Android App Link `sha256_cert_fingerprints` (TASK-1.25).
  // Virgülle ayrılmış SHA256 fingerprint listesi. EAS Build imza sertifikası
  // Yakın 5'te alınınca gerçek fingerprint girilir; o ana kadar placeholder
  // (yanlış fingerprint → Android intent chooser çıkar, autoVerify başarısız).
  ANDROID_SHA256_CERT_FINGERPRINTS: z
    .string()
    .min(1)
    .default(
      'FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF:FF',
    ),
});

const envSchema = baseSchema.transform((env) => {
  const fallbackLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';
  return { ...env, LOG_LEVEL: env.LOG_LEVEL ?? fallbackLevel };
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new EnvValidationError(issues);
  }
  return result.data;
}
