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
        find: '@client/data-model/',
        replacement: fileURLToPath(new URL('../../packages/data-model/src/', import.meta.url)),
      },
      {
        find: '@southneuhof/utilities/',
        replacement: fileURLToPath(new URL('../../packages/utilities/src/', import.meta.url)),
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
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
