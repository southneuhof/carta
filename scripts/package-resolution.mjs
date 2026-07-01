import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
  return Object.entries(providerPackages).flatMap(([name, sourceDir]) => {
    const absoluteSource = path.resolve(repoRoot, sourceDir)
    return fs.existsSync(absoluteSource) ? packageAlias(name, sourceDir) : []
  })
}

export function createPortablePackageAliases() {
  return [
    ...createWorkspacePackageAliases(),
    ...createProviderSourceAliases(),
  ]
}

export { clientPackages, providerPackages }
