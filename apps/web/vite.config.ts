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
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: '@client/data-model/',
        replacement: fileURLToPath(new URL('../../packages/data-model/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-data-model$/,
        replacement: fileURLToPath(new URL('../../packages/model-meta/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-data-model/',
        replacement: fileURLToPath(new URL('../../packages/model-meta/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/is-vue-framework$/,
        replacement: fileURLToPath(new URL('../../packages/vue-framework/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/',
        replacement: fileURLToPath(new URL('../../packages/vue-framework/src/', import.meta.url)),
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
        find: /^@repo\/sdk$/,
        replacement: fileURLToPath(new URL('../../packages/sdk/src/index.ts', import.meta.url)),
      },
    ],
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
