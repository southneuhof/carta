import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { publishablePackages } from './release-packages.mjs'

const timeoutMs = Number(process.env.PACKAGE_WAIT_TIMEOUT_MS || 10 * 60 * 1000)
const intervalMs = Number(process.env.PACKAGE_WAIT_INTERVAL_MS || 15 * 1000)
const registry = process.env.NPM_CONFIG_REGISTRY || 'https://npm.pkg.github.com'
const startedAt = Date.now()

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function versionFor(pkg) {
  return JSON.parse(readFileSync(`${pkg.root}/package.json`, 'utf8')).version
}

function isPublished(pkg, version) {
  try {
    const output = execFileSync('npm', ['view', `${pkg.name}@${version}`, 'version', `--registry=${registry}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
    return output === version
  } catch {
    return false
  }
}

const expected = publishablePackages.map((pkg) => [pkg, versionFor(pkg)])

while (true) {
  const missing = expected.filter(([pkg, version]) => !isPublished(pkg, version))

  if (missing.length === 0) {
    console.log('All publishable packages are resolvable from the registry.')
    process.exit(0)
  }

  if (Date.now() - startedAt > timeoutMs) {
    console.error('Timed out waiting for published packages:')
    for (const [pkg, version] of missing) console.error(`- ${pkg.name}@${version}`)
    process.exit(1)
  }

  console.log(`Waiting for packages: ${missing.map(([pkg, version]) => `${pkg.name}@${version}`).join(', ')}`)
  sleep(intervalMs)
}
