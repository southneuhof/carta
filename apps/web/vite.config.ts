import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { applyRouteGroupLayouts } from './src/router/file-routing/layout-groups'

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_'],
  plugins: [
    VueRouter({
      routesFolder: 'src/routes',
      extensions: ['.route.vue', '.layout.vue'],
      dts: 'src/route-map.d.ts',
      beforeWriteFiles: applyRouteGroupLayouts,
    }),
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
      {
        find: /^@southneuhof\/api$/,
        replacement: fileURLToPath(new URL('../api/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/api/',
        replacement: fileURLToPath(new URL('../api/src/', import.meta.url)),
      },
      {
        find: /^@southneuhof\/domain$/,
        replacement: fileURLToPath(new URL('../../packages/domain/src/index.ts', import.meta.url)),
      },
      {
        find: /^@southneuhof\/sdk$/,
        replacement: fileURLToPath(new URL('../../packages/sdk/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/sdk/',
        replacement: fileURLToPath(new URL('../../packages/sdk/src/', import.meta.url)),
      },
    ],
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
