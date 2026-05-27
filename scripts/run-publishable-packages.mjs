import { spawnSync } from 'node:child_process'
import { publishablePackages, packageFilterArgs } from './release-packages.mjs'

const command = process.argv[2]

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (['build', 'test', 'type-check'].includes(command)) {
  run('pnpm', [...packageFilterArgs(), command])
} else if (command === 'pack') {
  run('pnpm', ['build'])
  for (const pkg of publishablePackages) {
    run('pnpm', ['--dir', pkg.root, 'pack'])
  }
} else {
  console.error('Usage: node scripts/run-publishable-packages.mjs <build|test|type-check|pack>')
  process.exit(2)
}
