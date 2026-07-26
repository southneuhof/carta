import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // `{}` is used deliberately as a generic default meaning "no extra input".
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/__tests__/**/*.ts'],
    rules: {
      // Type-level assertions in tests declare bindings that are only read as types.
      '@typescript-eslint/no-unused-vars': 'off',
      'no-constant-condition': 'off',
    },
  },
)
