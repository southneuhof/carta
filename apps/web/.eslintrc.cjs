/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  ignorePatterns: ['src/assets/lib/tinymce/**', 'dist/**', 'build/**', 'coverage/**', 'public/generated/**'],
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-typescript', '@vue/eslint-config-prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.cjs', '**/*.config.js', '**/*.config.cjs', 'postcss.config.js', 'tailwind.config.js'],
      env: { node: true },
    },
    {
      files: ['src/routes/**/*.vue', 'src/assets/corporate/common/*.vue', 'src/components/navigations/sidebar/**/*.vue'],
      rules: { 'vue/multi-word-component-names': 'off' },
    },
    {
      files: ['src/**/*.spec.ts'],
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-reserved-component-names': 'off',
      },
    },
    {
      files: ['src/routes/(public)/auth/login/index.route.vue'],
      rules: { 'no-empty': 'off' },
    },
  ],
}
