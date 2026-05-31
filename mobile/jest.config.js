// Mobile component test config.
// `jest-expo/ios` tek-platform preset'i seçildi: Universal multi-project preset
// her testi web/node/ios/android için ayrı ayrı koşturur; component'lerimiz
// platform-agnostic olduğu için tek platform yeterli, koşum süresi düşük kalır.
// Platform-specific davranış gerektiğinde universal preset'e geçilir.

const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/ios',
  rootDir: __dirname,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // MSW v2 conditional exports — react-native test env default'unda
  // `msw/node` çözümü için node condition'ı manuel açılır.
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // MSW v2 transitive deps `.mjs` dosyaları sunar; jest-expo default
  // transform regex'i sadece `.js/.ts/.tsx` match eder. `.mjs` için
  // babel-jest açılır (preset'in caller-aware transform'u .js/.ts/.tsx'te kalır).
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  // Default whitelist: MSW v2 ESM zinciri (rettime/.mjs) + Expo modüllerinin
  // `.ts` kaynakları (expo-modules-core/src) jest-expo'nun karmaşık iç-içe
  // `.pnpm/<pkg>/node_modules/<pkg>` lookup'ında inner `node_modules/<pkg>/`
  // tarafından yakalanıyordu. Sadece bilinen "transform edilmemesi gereken"
  // path'leri ignore'a alıyoruz — kalan her şey babel-jest'ten geçer.
  transformIgnorePatterns: [
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/', '/\\.expo-export-smoke/'],
  // i18n JSON kaynakları + shared paketinin .js→.ts shim'ine ihtiyaç yok:
  // jest-expo preset moduleFileExtensions zaten .ts/.tsx/.js içeriyor; ham
  // `.js` import edilen TS dosyaları için moduleNameMapper kuruyoruz.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@alpfit/shared$': '<rootDir>/../shared/src/index.ts',
    '^@alpfit/shared/(.*)$': '<rootDir>/../shared/src/$1',
    // expo-secure-store native modülü Jest'te yok → bellek-içi mock (TASK-1.33).
    '^expo-secure-store$': '<rootDir>/test/mocks/expo-secure-store.ts',
    // @react-native-async-storage native modülü Jest'te yok → bellek-içi mock (TASK-2.14).
    '^@react-native-async-storage/async-storage$': '<rootDir>/test/mocks/async-storage.ts',
    // expo-notifications native modülü Jest'te yok → minimal mock (TASK-3.11).
    '^expo-notifications$': '<rootDir>/test/mocks/expo-notifications.ts',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__snapshots__/**',
    '!**/test/**',
  ],
  coverageDirectory: path.join(__dirname, 'coverage'),
  coveragePathIgnorePatterns: ['/node_modules/', '/.expo/', '/test/'],
  // jest-expo preset transformIgnorePatterns yeterli; gerekince whitelist eklenir.
  // i18next + react-i18next ESM çıktısı verir ama jest-expo babel-jest CommonJS'e çevirir.
};
