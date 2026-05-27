import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishablePackages, packageFilterArgs } from './release-packages.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const command = process.argv[2]
const packDestination = path.resolve(process.env.PACKAGE_TARBALL_DIR || path.join(repoRoot, '.local', 'package-tarballs'))

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (['build', 'test', 'type-check'].includes(command)) {
  run('pnpm', [...packageFilterArgs(), command])
} else if (command === 'pack') {
  run('pnpm', ['build'])
  fs.mkdirSync(packDestination, { recursive: true })
  for (const pkg of publishablePackages) {
    run('pnpm', ['--dir', pkg.root, 'pack', '--pack-destination', packDestination])
  }
} else {
  console.error('Usage: node scripts/run-publishable-packages.mjs <build|test|type-check|pack>')
  process.exit(2)
}
