// @ts-check
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat ESLint config — TypeScript + import order + Prettier uyumu.
 *
 * `no-restricted-syntax` ile raw `.toLowerCase()` / `.toUpperCase()` yasaktır
 * (PHASE-1 §Araştırma Tuzaklar #5; TASK-1.06). `@alpfit/shared` → `trLower` /
 * `trUpper` kullanılır. Argümanlı `.toLocaleLowerCase('tr-TR')` (selector
 * `:not([arguments.length>=1])` ile) izinlidir — locale util'leri kendi
 * implementasyonunda bunu kullanır.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.expo-export-smoke/**',
      '**/coverage/**',
      '**/generated/**',
      '**/*.tsbuildinfo',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toLowerCase']:not([arguments.length>=1])",
          message:
            "Ham .toLowerCase() yasak (TR 'İ' → 'i̇' tuzağı). @alpfit/shared → trLower() kullan.",
        },
        {
          selector: "CallExpression[callee.property.name='toUpperCase']:not([arguments.length>=1])",
          message:
            "Ham .toUpperCase() yasak (TR 'i' → 'I' tuzağı). @alpfit/shared → trUpper() kullan.",
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  // CommonJS configs (Expo's metro.config.js + babel.config.js, vb.) —
  // require()/module/__dirname kullanır; tseslint recommended bunları yasaklar.
  {
    files: ['**/metro.config.js', '**/babel.config.js', '**/*.config.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettierConfig,
);
