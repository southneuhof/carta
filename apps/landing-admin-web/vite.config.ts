import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createPortablePackageAliases } from '../../scripts/package-resolution.mjs'

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
        find: /^@southneuhof\/is-vue-framework$/,
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/is-vue-framework/',
        replacement: fileURLToPath(new URL('../../packages/is-vue-framework/src/', import.meta.url)),
      },
      ...createPortablePackageAliases(),
    ],
  },
  optimizeDeps: {
    exclude: ['@client/section-schema'],
  },
  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '!**/node_modules/@client/section-schema/**',
        '!**/packages/section-schema/**',
      ],
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
