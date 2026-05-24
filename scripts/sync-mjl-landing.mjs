import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const push = args.has('--push')
const targetArg = process.argv.find((arg) => arg.startsWith('--target='))
const targetRoot = path.resolve(targetArg ? targetArg.slice('--target='.length) : '/Users/gamer/Documents/projects/mjl-landing')
const remoteArg = process.argv.find((arg) => arg.startsWith('--remote='))
const remote = remoteArg?.slice('--remote='.length) || process.env.MJL_LANDING_REMOTE || ''

const includedRoots = [
  'apps/landing-mjl',
  'apps/landing-admin-web',
  'packages/data-model',
  'packages/section-schema',
]

const excludedNames = new Set([
  'node_modules',
  'pnpm-lock.yaml',
  'dist',
  'build',
  '.svelte-kit',
  '.turbo',
  '.expo',
  '.DS_Store',
])

const providerPackageNames = [
  '@southneuhof/apostle',
  '@southneuhof/is-data-model',
  '@southneuhof/is-vue-framework',
  '@southneuhof/landing-section-schema',
  '@southneuhof/landing-sveltekit-framework',
  '@southneuhof/utilities',
]

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'))
}

const providerVersions = Object.fromEntries(
  providerPackageNames.map((name) => {
    const dir = name.replace('@southneuhof/', '')
    const pkg = readJson(`packages/${dir}/package.json`)
    return [name, `^${pkg.version}`]
  }),
)

function shouldExclude(name, fullPath) {
  if (excludedNames.has(name)) return true
  if (name === '.env') return true
  if (name.endsWith('.tsbuildinfo')) return true
  if (fullPath.includes(`${path.sep}.local${path.sep}`)) return true
  return false
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)
    if (shouldExclude(entry.name, sourcePath)) continue
    if (entry.isDirectory()) copyDir(sourcePath, targetPath)
    else fs.copyFileSync(sourcePath, targetPath)
  }
}

function rewritePackageJson(relativeFile) {
  const file = path.join(targetRoot, relativeFile)
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))

  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!pkg[section]) continue
    for (const [name, version] of Object.entries(providerVersions)) {
      if (pkg[section][name]?.startsWith('workspace:')) pkg[section][name] = version
    }
  }

  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
}

function writeRootFiles() {
  const rootPkg = readJson('package.json')
  const deployPkg = {
    name: 'mjl-landing',
    private: true,
    version: '0.0.0',
    packageManager: rootPkg.packageManager,
    scripts: {
      'landing:dev': "sh -c 'pnpm run landing:dev:server & pnpm run landing:dev:admin & wait'",
      'landing:dev:server': 'pnpm --dir apps/landing-mjl dev -- --port 5173 --strictPort',
      'landing:dev:admin': 'pnpm --dir apps/landing-admin-web dev -- --port 5174 --strictPort',
      'landing:build': 'pnpm --dir apps/landing-mjl build && pnpm --dir apps/landing-admin-web build',
      'landing:check-portable': 'node scripts/check-portable-landing.mjs',
    },
    devDependencies: {
      turbo: rootPkg.devDependencies.turbo,
      typescript: rootPkg.devDependencies.typescript,
      'vue-tsc': rootPkg.devDependencies['vue-tsc'],
    },
  }

  fs.writeFileSync(path.join(targetRoot, 'package.json'), `${JSON.stringify(deployPkg, null, 2)}\n`)
  fs.writeFileSync(path.join(targetRoot, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n  - packages/*\n')
  fs.copyFileSync(path.join(repoRoot, 'tsconfig.base.json'), path.join(targetRoot, 'tsconfig.base.json'))
  fs.copyFileSync(path.join(repoRoot, 'turbo.json'), path.join(targetRoot, 'turbo.json'))
  fs.copyFileSync(path.join(repoRoot, '.npmrc'), path.join(targetRoot, '.npmrc'))
  fs.mkdirSync(path.join(targetRoot, 'scripts'), { recursive: true })
  fs.copyFileSync(path.join(repoRoot, 'scripts', 'check-portable-landing.mjs'), path.join(targetRoot, 'scripts', 'check-portable-landing.mjs'))
  fs.copyFileSync(path.join(repoRoot, 'scripts', 'package-resolution.mjs'), path.join(targetRoot, 'scripts', 'package-resolution.mjs'))
  fs.copyFileSync(path.join(repoRoot, 'scripts', 'package-resolution.d.ts'), path.join(targetRoot, 'scripts', 'package-resolution.d.ts'))
  fs.writeFileSync(path.join(targetRoot, '.gitignore'), 'node_modules\n.pnpm-store\n.turbo\n.svelte-kit\ndist\nbuild\n.env\n.local\n*.tsbuildinfo\n.DS_Store\n')
}

if (dryRun) {
  console.log(`Would generate ${targetRoot}`)
  console.log(`Included roots: ${includedRoots.join(', ')}`)
  process.exit(0)
}

fs.mkdirSync(targetRoot, { recursive: true })
for (const entry of fs.readdirSync(targetRoot)) {
  if (entry === '.git') continue
  if (excludedNames.has(entry)) continue
  fs.rmSync(path.join(targetRoot, entry), { recursive: true, force: true })
}

for (const root of includedRoots) {
  copyDir(path.join(repoRoot, root), path.join(targetRoot, root))
}
writeRootFiles()

for (const file of [
  'apps/landing-mjl/package.json',
  'apps/landing-admin-web/package.json',
  'packages/section-schema/package.json',
  'packages/data-model/package.json',
]) {
  rewritePackageJson(file)
}

if (!fs.existsSync(path.join(targetRoot, '.git'))) {
  execFileSync('git', ['init'], { cwd: targetRoot, stdio: 'inherit' })
}

execFileSync('git', ['add', '.'], { cwd: targetRoot, stdio: 'inherit' })
const stagedDiff = spawnSync('git', ['diff', '--cached', '--quiet'], {
  cwd: targetRoot,
  stdio: 'inherit',
})

if (stagedDiff.status === 1) {
  execFileSync('git', ['commit', '-m', 'Sync landing apps'], { cwd: targetRoot, stdio: 'inherit' })
} else if (stagedDiff.status === 0) {
  console.log('No landing sync changes to commit.')
} else {
  process.exit(stagedDiff.status ?? 1)
}

if (push) {
  if (remote) {
    const remotes = execFileSync('git', ['remote'], { cwd: targetRoot, encoding: 'utf8' }).split('\n')
    if (!remotes.includes('origin')) execFileSync('git', ['remote', 'add', 'origin', remote], { cwd: targetRoot, stdio: 'inherit' })
  }
  execFileSync('git', ['push', '-u', 'origin', 'HEAD:main'], { cwd: targetRoot, stdio: 'inherit' })
}

console.log(`Generated ${targetRoot}`)
