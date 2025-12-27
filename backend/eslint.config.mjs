// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';

/**
 * ESLint config for KadryHR backend (Node.js + CommonJS)
 */
export default [
  // Bazowy zestaw reguł dla JS
  js.configs.recommended,

  // Ustawienia dla całego backendu
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'uploads/**',
      'dist/**',
      'coverage/**',
      // dodaj tu generowane katalogi, jeśli jakieś masz
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Tu możesz dorzucić swoje reguły, na start coś łagodnego:
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // (Opcjonalnie) inne pliki, np. testy
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // Możesz złagodzić reguły dla testów, jeśli potrzeba
    },
  },
];
