import { access, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const packages = [
  {
    name: '@southneuhof/is-data-model',
    root: 'packages/is-data-model',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/apostle',
    root: 'packages/apostle',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/utilities',
    root: 'packages/utilities',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'src/index.ts',
    ],
  },
  {
    name: '@southneuhof/is-vue-framework',
    root: 'packages/is-vue-framework',
    requiredFiles: [
      'dist/index.js',
      'dist/index.js.map',
      'dist/index.d.ts',
      'dist/index.d.ts.map',
      'dist/components/base/Button.vue',
      'dist/components/composites/CRUDComposite.vue',
      'dist/styles/framework.css',
      'src/index.ts',
      'src/components/composites/CRUDComposite.vue',
    ],
  },
  {
    name: '@southneuhof/landing-sveltekit-framework',
    root: 'packages/landing-sveltekit-framework',
    requiredFiles: [
      'dist/index.js',
      'dist/index.d.ts',
      'dist/components/LandingPage.svelte',
      'dist/components/SectionRenderer.svelte',
      'dist/components/SectionWrapper.svelte',
      'dist/components/IntersectionObserver.svelte',
      'dist/styles/framework.css',
      'src/index.ts',
      'src/components/LandingPage.svelte',
    ],
  },
]

const forbiddenTarballPatterns = [
  /\/__tests__\//,
  /(?:^|\/)[^/]+\.(?:spec|test)\.[^/]+$/,
  /tsconfig\.build\.tsbuildinfo$/,
]

const missing = []
const forbidden = []

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

  return `${pkg.root}/${tarballName}`
}

for (const pkg of packages) {
  const tarball = await packageTarballPath(pkg)

  for (const file of pkg.requiredFiles) {
    await verifyLocalFile(pkg.root, file)
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

if (missing.length > 0 || forbidden.length > 0) {
  const sections = []

  if (missing.length > 0) {
    sections.push(`Missing files:\n${missing.join('\n')}`)
  }

  if (forbidden.length > 0) {
    sections.push(`Forbidden packed files:\n${forbidden.join('\n')}`)
  }

  throw new Error(`Package verification failed.\n${sections.join('\n\n')}`)
}

console.log('Package contents verified.')
