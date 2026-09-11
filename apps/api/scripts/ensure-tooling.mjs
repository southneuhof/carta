#!/usr/bin/env node
// Ensure Sprindle route tooling exists before API scripts use it.
// dist-tooling is gitignored build output, so a fresh checkout may miss it.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sprindleRoot = resolve(apiRoot, '../../packages/sprindle')
const marker = resolve(sprindleRoot, 'dist-tooling/index.js')

if (existsSync(marker)) process.exit(0)

const tooling = spawnSync('node', ['tooling/package.mjs'], { cwd: sprindleRoot, stdio: 'inherit' })
if (tooling.status !== 0) {
  process.stderr.write('Sprindle tooling build failed.\n')
  process.exit(tooling.status ?? 1)
}
