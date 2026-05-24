import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { providerPackages } from './package-resolution.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localRoot = path.join(repoRoot, '.local', 'provider-packages')
const configPath = path.join(repoRoot, '.local', 'provider-packages.json')

const repoByPackage = {
  '@southneuhof/apostle': 'https://github.com/southneuhof/apostle.git',
  '@southneuhof/is-data-model': 'https://github.com/southneuhof/is-data-model.git',
  '@southneuhof/is-vue-framework': 'https://github.com/southneuhof/is-vue-framework.git',
  '@southneuhof/landing-section-schema': 'https://github.com/southneuhof/landing-section-schema.git',
  '@southneuhof/landing-sveltekit-framework': 'https://github.com/southneuhof/landing-sveltekit-framework.git',
  '@southneuhof/utilities': 'https://github.com/southneuhof/utilities.git',
}

const selected = process.argv.slice(2)
const packages = selected.length > 0 ? selected : Object.keys(providerPackages)
const config = { packages: {} }

fs.mkdirSync(localRoot, { recursive: true })

for (const name of packages) {
  if (!providerPackages[name]) {
    throw new Error(`Unknown provider package: ${name}`)
  }

  const dirName = name.replace('@southneuhof/', '')
  const target = path.join(localRoot, dirName)
  const repo = repoByPackage[name]

  if (!fs.existsSync(target)) {
    execFileSync('git', ['clone', '--depth', '1', repo, target], { stdio: 'inherit' })
  }

  config.packages[name] = path.relative(repoRoot, path.join(target, 'src'))
}

fs.mkdirSync(path.dirname(configPath), { recursive: true })
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
console.log(`Wrote ${path.relative(repoRoot, configPath)}`)
