import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg(databaseUrl);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  __alpfitPrisma?: PrismaClient;
};

export function getPrisma(databaseUrl: string): PrismaClient {
  if (!globalForPrisma.__alpfitPrisma) {
    globalForPrisma.__alpfitPrisma = createPrismaClient(databaseUrl);
  }
  return globalForPrisma.__alpfitPrisma;
}

export type { PrismaClient };
