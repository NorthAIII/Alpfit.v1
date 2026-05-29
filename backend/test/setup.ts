import { vi } from 'vitest';

// Stub baseline env so loadEnv() passes in tests where envs are not explicitly
// provided. Per-suite helpers (build-test-server.ts) override DATABASE_URL with
// a freshly created isolated database before each Fastify instance boots.
vi.stubEnv('NODE_ENV', 'development');
vi.stubEnv('APP_ENV', 'test');
vi.stubEnv('PORT', '3000');
vi.stubEnv('LOG_LEVEL', 'silent');
vi.stubEnv('DATABASE_URL', 'postgres://dev:dev@postgres:5432/dev');
vi.stubEnv('REDIS_URL', 'redis://redis:6379');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-at-least-32-characters-long');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-at-least-32-characters-long');
