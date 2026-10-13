import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/* ============================================================
   ✅ Next.js 15+ ESLint Flat Config
   ============================================================ */

const eslintConfig = defineConfig([
  /* Default Next.js rules (core-web-vitals + TypeScript) */
  ...nextVitals,
  ...nextTs,

  /* ============================================================
     Global ignores
     ============================================================ */
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    'public/**',
    '.baileys-auth/**',
    'next-env.d.ts',
    '**/*.config.js',
    '**/*.config.mjs',
    '**/*.config.ts',
  ]),

  /* ============================================================
     Custom rules
     ============================================================ */
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      /* ---------- TypeScript ---------- */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      /* ---------- React ---------- */
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react/display-name': 'off',

      /* ---------- Next.js ---------- */
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',

      /* ---------- General ---------- */
      'prefer-const': 'warn',
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;