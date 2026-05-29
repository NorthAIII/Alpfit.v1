import { defineConfig } from 'vitest/config';

/**
 * Shared paket için bağımsız Vitest config (backend'in vitest.config.ts'inden
 * ayrı — paket bağımsızlığı, M3 motoru tarih/saat testleri TR timezone garanti
 * etmeli). `env.TZ = 'Europe/Istanbul'` ile date-fns-tz çıktısı host TZ'dan
 * bağımsız doğrulanır; testler aynı zamanda explicit `formatInTimeZone` ile
 * çift-savunma yapar.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 10_000,
    env: {
      TZ: 'Europe/Istanbul',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/index.ts'],
    },
  },
});
