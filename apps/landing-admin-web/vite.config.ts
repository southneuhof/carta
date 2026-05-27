import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createPortablePackageAliases } from '../../scripts/package-resolution.mjs'

const appRootDir = fileURLToPath(new URL('.', import.meta.url))
const localFrameworkSourceDir = path.resolve(appRootDir, '..', '..', 'packages', 'is-vue-framework', 'src')
const localFrameworkSourceEntry = path.join(localFrameworkSourceDir, 'index.ts')
const useLocalFrameworkSource = fs.existsSync(localFrameworkSourceEntry)

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
      ...(useLocalFrameworkSource
        ? [
            {
              find: /^@southneuhof\/is-vue-framework$/,
              replacement: localFrameworkSourceEntry,
            },
            {
              find: '@southneuhof/is-vue-framework/',
              replacement: localFrameworkSourceDir,
            },
          ]
        : []),
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
