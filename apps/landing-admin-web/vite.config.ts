import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_'],
  plugins: [
    vue({
      script: {
        defineModel: true,
      },
    }),
  ],
  resolve: {
    dedupe: ['vue', 'vue-router'],
    extensions: ['.web.ts', '.web.tsx', '.web.mts', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: /^@client\/data-model$/,
        replacement: fileURLToPath(new URL('../../packages/data-model/src/index.ts', import.meta.url)),
      },
      {
        find: '@client/data-model/',
        replacement: fileURLToPath(new URL('../../packages/data-model/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/apostle$/,
        replacement: fileURLToPath(new URL('../../packages/apostle/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/apostle/',
        replacement: fileURLToPath(new URL('../../packages/apostle/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-data-model$/,
        replacement: fileURLToPath(new URL('../../packages/is-data-model/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-data-model/',
        replacement: fileURLToPath(new URL('../../packages/is-data-model/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/landing-section-schema$/,
        replacement: fileURLToPath(new URL('../../packages/landing-section-schema/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/landing-section-schema/',
        replacement: fileURLToPath(new URL('../../packages/landing-section-schema/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/utilities$/,
        replacement: fileURLToPath(new URL('../../packages/utilities/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/utilities/',
        replacement: fileURLToPath(new URL('../../packages/utilities/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-vue-framework$/,
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/index.ts', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-vue-framework\/router$/,
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/router/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/router/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/router/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-vue-framework\/renderers$/,
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/renderers/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/renderers/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/renderers/', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/components/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/components/', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/adapters/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/adapters/', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/behaviors/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/behaviors/', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/services/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/services/', import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@southneuhof/landing-section-schema'],
  },
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL('../..', import.meta.url)),
        fileURLToPath(new URL('../../packages/landing-section-schema', import.meta.url)),
      ],
    },
    watch: {
      // Keep default node_modules ignore, but un-ignore this workspace package if resolved via links.
      ignored: [
        '**/node_modules/**',
        '!**/node_modules/@southneuhof/landing-section-schema/**',
        '!**/packages/landing-section-schema/**',
      ],
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
