/**
 * SMS provider factory (TASK-1.17).
 *
 * `env.SMS_PROVIDER` değerine göre uygun driver'ı döner. Çağrı yapan kod
 * (OTP gönderim route'u — TASK-1.18+) yalnızca `SmsProvider` interface'ini
 * görür; hangi driver'ın döndüğünü bilmez.
 */
import { MockSmsProvider } from './mock-sms-provider.js';

import type { SmsProvider } from './sms-provider.js';
import type { Env } from '../config/env.js';
import type { PrismaClient } from '../db/prisma.js';
import type { FastifyBaseLogger } from 'fastify';

export interface CreateSmsProviderDeps {
  prisma: PrismaClient;
  logger: FastifyBaseLogger;
}

/**
 * Env'e göre SMS driver'ı kurar.
 *
 * @throws {Error} `live` seçilirse — Live provider Yakın 5'te eklenir; o tarihe
 *   kadar `live` değeri konfigürasyon hatasıdır (fail-fast).
 */
export function createSmsProvider(
  env: Pick<Env, 'SMS_PROVIDER'>,
  deps: CreateSmsProviderDeps,
): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case 'mock':
      return new MockSmsProvider({ prisma: deps.prisma, logger: deps.logger });
    case 'live':
      throw new Error('Live SMS provider not implemented yet (Yakın 5 — TECH-STACK.md).');
    default: {
      const exhaustive: never = env.SMS_PROVIDER;
      throw new Error(`Unknown SMS_PROVIDER: ${String(exhaustive)}`);
    }
  }
}

export type { SmsProvider, SmsSendResult } from './sms-provider.js';
export { MockSmsProvider } from './mock-sms-provider.js';
