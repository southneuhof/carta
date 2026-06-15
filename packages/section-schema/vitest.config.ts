import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const packageRoot = dirname(fileURLToPath(import.meta.url))
const landingSectionSchemaRoot = resolve(packageRoot, '../landing-section-schema/src')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@southneuhof/landing-section-schema/defineSectionSchema',
        replacement: resolve(landingSectionSchemaRoot, 'defineSectionSchema.ts'),
      },
      {
        find: '@southneuhof/landing-section-schema/server',
        replacement: resolve(landingSectionSchemaRoot, 'server.ts'),
      },
      {
        find: '@southneuhof/landing-section-schema',
        replacement: resolve(landingSectionSchemaRoot, 'index.ts'),
      },
    ],
  },
})
