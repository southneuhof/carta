import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localConfigPath = path.join(repoRoot, '.local', 'provider-packages.json')

const clientPackages = {
  '@client/data-model': 'packages/data-model/src',
  '@client/section-schema': 'packages/section-schema/src',
}

const providerPackages = {
  '@southneuhof/apostle': 'packages/apostle/src',
  '@southneuhof/is-data-model': 'packages/is-data-model/src',
  '@southneuhof/is-vue-framework': 'packages/is-vue-framework/src',
  '@southneuhof/landing-section-schema': 'packages/landing-section-schema/src',
  '@southneuhof/landing-sveltekit-framework': 'packages/landing-sveltekit-framework/src',
  '@southneuhof/utilities': 'packages/utilities/src',
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function readLocalProviderConfig() {
  if (!fs.existsSync(localConfigPath)) return { packages: {} }

  const parsed = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'))
  return {
    packages: parsed && typeof parsed.packages === 'object' && parsed.packages ? parsed.packages : {},
  }
}

function packageAlias(name, sourceDir) {
  const absoluteSource = path.resolve(repoRoot, sourceDir)
  const indexFile = path.join(absoluteSource, 'index.ts')

  return [
    {
      find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      replacement: fs.existsSync(indexFile) ? indexFile : absoluteSource,
    },
    {
      find: `${name}/`,
      replacement: `${toPosix(absoluteSource)}/`,
    },
  ]
}

export function createWorkspacePackageAliases() {
  return Object.entries(clientPackages).flatMap(([name, sourceDir]) => packageAlias(name, sourceDir))
}

export function createProviderSourceAliases() {
  const config = readLocalProviderConfig()

  return Object.entries(config.packages).flatMap(([name, configuredPath]) => {
    if (!providerPackages[name]) return []

    const sourceDir = typeof configuredPath === 'string' && configuredPath.trim()
      ? configuredPath
      : providerPackages[name]

    return packageAlias(name, sourceDir)
  })
}

export function createWorkspaceProviderDistAliases() {
  const config = readLocalProviderConfig()
  const localized = new Set(Object.keys(config.packages))

  return Object.entries(providerPackages).flatMap(([name, sourceDir]) => {
    if (localized.has(name)) return []

    const packageRoot = path.resolve(repoRoot, sourceDir, '..')
    const distDir = path.join(packageRoot, 'dist')
    if (!fs.existsSync(distDir)) return []

    return packageAlias(name, path.relative(repoRoot, distDir))
  })
}

export function createPortablePackageAliases() {
  return [
    ...createWorkspacePackageAliases(),
    ...createProviderSourceAliases(),
    ...createWorkspaceProviderDistAliases(),
  ]
}

export { clientPackages, providerPackages, localConfigPath }
