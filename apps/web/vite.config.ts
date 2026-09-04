import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { applyFileRouteConventions } from './src/router/file-routing/layout-groups'
import { staticRouteName } from './src/router/file-routing/names'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.WEB_PORT)
  if (!port) throw new Error('WEB_PORT is not set.')
  return {
  envPrefix: ['VITE_'],
  server: {
    port,
    strictPort: true,
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/routes',
      extensions: ['.route.vue', '.layout.vue'],
      dts: 'src/route-map.d.ts',
      getRouteName: staticRouteName,
      beforeWriteFiles: applyFileRouteConventions,
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
        find: /^@southneuhof\/loom$/,
        replacement: fileURLToPath(new URL('../../packages/loom/src/index.ts', import.meta.url)),
      },
      {
        find: '@southneuhof/loom/',
        replacement: fileURLToPath(new URL('../../packages/loom/src/', import.meta.url)),
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
  test: {
    environment: 'jsdom',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    poolOptions: {
      forks: {
        maxWorkers: 2,
      },
    },
  },
  }
})
