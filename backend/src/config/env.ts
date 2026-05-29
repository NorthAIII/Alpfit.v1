import { z } from 'zod';

const NODE_ENVS = ['development', 'staging', 'production'] as const;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const baseSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
  APP_ENV: z.string().min(1).default('local'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
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
