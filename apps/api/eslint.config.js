import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
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
      '@typescript-eslint/no-unused-vars': 'off',
      'no-constant-condition': 'off',
    },
  },
)
