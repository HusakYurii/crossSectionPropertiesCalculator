import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

// plan 02 import policy, enforced (decision 2026-11-26, review Q3). `regex` needs ESLint >= 9.4.
// Flat config REPLACES a rule's options when a later block matches the same file, so every block below that
// sets `no-restricted-imports` spreads these patterns in again.
const IMPORT_POLICY_PATTERNS = [
  { regex: '\\.ts$', message: 'no .ts suffix in imports (plan 02 policy)' },
  { regex: '^(\\.{1,2}/)*\\.\\./\\.\\./\\.\\./', message: 'no relative climb of 3+ levels (../../../); use an @/ import (plan 02 policy)' },
];

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'fixtures/**', 'plansTemp/**'] },

  // parsing only: no stylistic rules
  ...pluginVue.configs['flat/base'],
  { files: ['src/**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'], sourceType: 'module' } } },
  { files: ['src/**/*.ts'], languageOptions: { parser: tseslint.parser, sourceType: 'module' } },
  // correctness rule; also gives fileNameUtils.ts' existing `eslint-disable-next-line no-control-regex` a real rule to disable
  { files: ['src/**/*.{ts,vue}'], rules: { 'no-control-regex': 'error' } },

  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json', extensions: ['.ts', '.d.ts', '.vue', '.js'] },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/ignore': ['src/vite-env.d.ts'],
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app',        mode: 'folder' },
        { type: 'feature',  pattern: 'src/features/*', mode: 'folder', capture: ['featureName'] },
        { type: 'store',    pattern: 'src/store',      mode: 'folder' },
        { type: 'solvers',  pattern: 'src/solvers',    mode: 'folder' },
        { type: 'shared',   pattern: 'src/shared',     mode: 'folder' },
      ],
    },
    rules: {
      // every source file must belong to a layer: this catches leftovers in legacy folders
      'boundaries/no-unknown-files': 'error',
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app',     allow: ['app', 'feature', 'store', 'solvers', 'shared'] },
          { from: 'feature', allow: ['feature', 'store', 'solvers', 'shared'] },  // other features: index only, see entry-point
          { from: 'store',   allow: ['store', 'solvers', 'shared'] },
          { from: 'solvers', allow: ['solvers', 'shared'] },
          { from: 'shared',  allow: ['shared'] },
        ],
      }],
      // cross-element imports must go through the public index; imports inside the same element are not checked
      'boundaries/entry-point': ['error', {
        default: 'allow',
        rules: [
          // boundaries 5: a rule holding both allow and disallow lets the disallow win, so they are two rules; the later one wins
          { target: ['feature', 'solvers'], disallow: ['**'] },
          { target: ['feature', 'solvers'], allow: ['index.ts'] },
        ],
      }],
      // plan 02 import policy for every file (re-spread in the per-layer blocks below)
      'no-restricted-imports': ['error', { patterns: IMPORT_POLICY_PATTERNS }],
    },
  },

  // solvers: framework-free, and only shared/{types,shapes,math}
  {
    files: ['src/solvers/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: ['vue', 'vue3-toastify'],
        patterns: [...IMPORT_POLICY_PATTERNS, {
          group: ['@/shared/*', '!@/shared/types', '!@/shared/types/*', '!@/shared/shapes', '!@/shared/shapes/*', '!@/shared/math', '!@/shared/math/*'],
          message: 'solvers may only import shared/types, shared/shapes and shared/math (todo §7.1)',
        }],
      }],
    },
  },

  // sibling .types.ts rule (decision 9; 98 §4): type imports are always a separate `import type` declaration,
  // which verbatimModuleSyntax erases. An inline `import { type X }` would leave `import 'x'` behind (a runtime edge).
  // no-cycle then sees only runtime edges: it ignores `import type` (baseline: 0 runtime cycles).
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { '@typescript-eslint': tseslint.plugin, 'import-x': importX },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.app.json', extensions: ['.ts', '.d.ts', '.vue', '.js'] })],
      'import-x/extensions': ['.ts', '.vue'],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },

  // runtime cycles: import-x cannot parse `.vue` dependencies with the TS parser, so the rule runs on `.ts` files only
  // and `.vue` modules are not traversed (plan 21 step 4 fallback; baseline: 0 runtime cycles)
  {
    files: ['src/**/*.ts'],
    plugins: { 'import-x': importX },
    settings: { 'import-x/ignore': ['\\.vue$'] },
    rules: { 'import-x/no-cycle': ['error', { ignoreExternal: true }] },
  },

  // store: no toast (plan 20 hand-off)
  {
    files: ['src/store/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { paths: ['vue3-toastify'], patterns: IMPORT_POLICY_PATTERNS }] },
  },

  // engine files never import their own barrel (plan 13 hand-off: init-order cycles)
  // (`regex` in patterns needs ESLint >= 9.4, which the devDependencies pin)
  {
    files: ['src/shared/canvas/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [...IMPORT_POLICY_PATTERNS, { regex: '^@/shared/canvas$', message: 'inside shared/canvas use relative imports, not the barrel' }] }] },
  },

  // custom-shape-modal-editor -> standard-shapes-modal-editor: TYPE-ONLY (plan 18, decision 2026-11-26, review Q5).
  // standard-shapes-modal-editor imports custom-shape-modal-editor at runtime; CustomShapeModalEditor only needs `import type { SectionFormExposeSource }`.
  // A value import here would create a runtime cycle, so it is an error; `import type` is allowed (erased by verbatimModuleSyntax).
  // Separate rule name (@typescript-eslint/…), so it does not replace the base `no-restricted-imports` policy above.
  {
    files: ['src/features/custom-shape-modal-editor/**/*.{ts,vue}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        paths: [{ name: '@/features/standard-shapes-modal-editor', allowTypeImports: true,
          message: 'custom-shape-modal-editor may import standard-shapes-modal-editor only with `import type` (no runtime cycle)' }],
      }],
    },
  },
];
