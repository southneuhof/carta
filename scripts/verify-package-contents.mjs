import { access, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishablePackages as packages } from './release-packages.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packDestination = path.resolve(process.env.PACKAGE_TARBALL_DIR || path.join(repoRoot, '.local', 'package-tarballs'))

const forbiddenTarballPatterns = [
  /\/__tests__\//,
  /(?:^|\/)[^/]+\.(?:spec|test)\.[^/]+$/,
  /tsconfig\.build\.tsbuildinfo$/,
]

const missing = []
const forbidden = []
const invalidImports = []

async function verifyLocalFile(packageRoot, file) {
  try {
    await access(`${packageRoot}/${file}`)
  } catch {
    missing.push(`${packageRoot}/${file}`)
  }
}

function readTarballEntries(tarball) {
  return execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function packageTarballPath(pkg) {
  const manifest = JSON.parse(await readFile(`${pkg.root}/package.json`, 'utf8'))
  const tarballName = `${manifest.name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`

  return path.join(packDestination, tarballName)
}

async function verifyDistImports(pkg, file) {
  if (!pkg.verifyNodeEsmImports) return
  if (!file.startsWith('dist/') || !file.endsWith('.js')) return

  const text = await readFile(`${pkg.root}/${file}`, 'utf8')
  const importPattern = /(?:from\s*['"]|import\s*\(\s*['"])(\.{1,2}\/[^'"]+)/g

  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1]
    if (!/\.(?:js|mjs|cjs|json|css|svelte|vue)(?:$|[?#])/.test(specifier)) {
      invalidImports.push(`${pkg.root}/${file}: extensionless relative import "${specifier}"`)
    }
  }
}

for (const pkg of packages) {
  const tarball = await packageTarballPath(pkg)

  for (const file of pkg.requiredFiles) {
    await verifyLocalFile(pkg.root, file)
    await verifyDistImports(pkg, file)
  }

  let entries
  try {
    entries = readTarballEntries(tarball)
  } catch {
    missing.push(tarball)
    continue
  }

  const entrySet = new Set(entries)

  for (const file of pkg.requiredFiles) {
    const packedPath = `package/${file}`

    if (!entrySet.has(packedPath)) {
      missing.push(`${tarball}:${packedPath}`)
    }
  }

  for (const entry of entries) {
    if (forbiddenTarballPatterns.some((pattern) => pattern.test(entry))) {
      forbidden.push(`${pkg.name}:${entry}`)
    }
  }
}

if (missing.length > 0 || forbidden.length > 0 || invalidImports.length > 0) {
  const sections = []

  if (missing.length > 0) {
    sections.push(`Missing files:\n${missing.join('\n')}`)
  }

  if (forbidden.length > 0) {
    sections.push(`Forbidden packed files:\n${forbidden.join('\n')}`)
  }

  if (invalidImports.length > 0) {
    sections.push(`Invalid dist imports:\n${invalidImports.join('\n')}`)
  }

  throw new Error(`Package verification failed.\n${sections.join('\n\n')}`)
}

console.log('Package contents verified.')
