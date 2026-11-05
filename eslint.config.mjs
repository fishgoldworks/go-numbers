import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
export default [
  {
    ignores: [
      'node_modules/**',
      'package/**',
      'artifacts/**',
      'coverage/**',
      '**/temp/**',
      '**/.tmp/**',
      '.go-numbers-build-*/**'
    ]
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] }
  },
  { files: ['**/*.mjs'], languageOptions: { sourceType: 'module' } },
  ...ts.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,mts,cts}'] })),
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }] }
  },
  // Authored CommonJS declaration namespaces model the existing export= API.
  {
    files: ['**/*.d.ts', '**/*.d.mts'],
    rules: { '@typescript-eslint/no-namespace': 'off', '@typescript-eslint/no-wrapper-object-types': 'off' }
  },
  // Consumer fixtures intentionally retain unused typed bindings and rejected calls.
  { files: ['test/types/**'], rules: { '@typescript-eslint/no-unused-vars': 'off' } }
];
