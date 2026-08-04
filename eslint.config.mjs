// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Shared base for the three plain-TS/Node packages (apps/api, packages/shared,
 * packages/qr-engine) - each invokes this directly via `eslint --config ../../eslint.config.mjs`.
 * apps/web has its own eslint.config.mjs layering eslint-config-next on top of this same base,
 * since `next lint` looks for a config in the app directory rather than following --config.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Prefixing an intentionally-unused parameter/binding with `_` is the standard escape
      // hatch (e.g. Express middleware signatures, destructuring for a side effect).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Non-type-checked "recommended" flags `any` as a warning already; downgrading further
      // isn't needed, but interface-vs-type and empty-function bans are stylistic noise this
      // codebase doesn't follow (NestJS lifecycle hooks are routinely empty on purpose).
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
