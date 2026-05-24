import { execFileSync } from 'node:child_process'

const packages = [
  {
    name: '@southneuhof/is-data-model',
    prefix: 'packages/is-data-model',
    repo: 'https://github.com/southneuhof/is-data-model.git',
    branch: 'main',
    tempBranch: 'sync/is-data-model',
  },
  {
    name: '@southneuhof/apostle',
    prefix: 'packages/apostle',
    repo: 'https://github.com/southneuhof/apostle.git',
    branch: 'main',
    tempBranch: 'sync/apostle',
  },
  {
    name: '@southneuhof/utilities',
    prefix: 'packages/utilities',
    repo: 'https://github.com/southneuhof/utilities.git',
    branch: 'main',
    tempBranch: 'sync/utilities',
  },
  {
    name: '@southneuhof/is-vue-framework',
    prefix: 'packages/is-vue-framework',
    repo: 'https://github.com/southneuhof/is-vue-framework.git',
    branch: 'main',
    tempBranch: 'sync/is-vue-framework',
  },
  {
    name: '@southneuhof/landing-section-schema',
    prefix: 'packages/landing-section-schema',
    repo: 'https://github.com/southneuhof/landing-section-schema.git',
    branch: 'main',
    tempBranch: 'sync/landing-section-schema',
  },
  {
    name: '@southneuhof/landing-sveltekit-framework',
    prefix: 'packages/landing-sveltekit-framework',
    repo: 'https://github.com/southneuhof/landing-sveltekit-framework.git',
    branch: 'main',
    tempBranch: 'sync/landing-sveltekit-framework',
  },
]

const args = new Set(process.argv.slice(2))
const allowAnyBranch = args.has('--allow-any-branch')
const dryRun = args.has('--dry-run')
const packageRepoToken = process.env.GITHUB_TOKEN_FOR_PACKAGE_REPOS

function run(command, options = {}) {
  if (dryRun && options.mutates !== false) {
    console.log(`[dry-run] ${command}`)
    return ''
  }

  const output = execFileSync(command, {
    encoding: 'utf8',
    shell: true,
    stdio: options.inherit ? 'inherit' : 'pipe',
  })

  return typeof output === 'string' ? output.trim() : ''
}

function assertMainBranch() {
  if (allowAnyBranch) return

  const branch = run('git branch --show-current', { mutates: false })

  if (branch !== 'main') {
    throw new Error(`Package repo sync must run from main. Current branch: ${branch || '(detached)'}`)
  }
}

function assertCleanWorkingTree() {
  if (dryRun) return

  const status = run('git status --porcelain', { mutates: false })

  if (status) {
    throw new Error(`Package repo sync requires a clean working tree:\n${status}`)
  }
}

function withToken(repo) {
  if (dryRun) {
    return repo
  }

  if (!packageRepoToken) {
    throw new Error('GITHUB_TOKEN_FOR_PACKAGE_REPOS is required to push package mirror repositories.')
  }

  return repo.replace('https://github.com/', `https://x-access-token:${packageRepoToken}@github.com/`)
}

function remoteHead(repo, branch) {
  if (dryRun) {
    return ''
  }

  const output = run(`git ls-remote --heads ${repo} ${branch}`, { mutates: false })
  const [sha] = output.split(/\s+/)

  return sha || ''
}

function cleanupTempBranch(tempBranch) {
  const exists = run(`git branch --list ${tempBranch}`, { mutates: false })

  if (exists) {
    run(`git branch -D ${tempBranch}`, { inherit: true })
  }
}

assertMainBranch()
assertCleanWorkingTree()

const pushed = []

for (const pkg of packages) {
  console.log(`Syncing ${pkg.name} from ${pkg.prefix}`)
  cleanupTempBranch(pkg.tempBranch)

  const splitSha = run(`git subtree split --prefix=${pkg.prefix} -b ${pkg.tempBranch}`)
  const pushUrl = withToken(pkg.repo)
  const expectedRemoteSha = remoteHead(pushUrl, pkg.branch)
  const lease = expectedRemoteSha ? `--force-with-lease=refs/heads/${pkg.branch}:${expectedRemoteSha}` : ''

  run(`git push ${lease} ${pushUrl} ${pkg.tempBranch}:${pkg.branch}`, { inherit: true })
  cleanupTempBranch(pkg.tempBranch)

  pushed.push(`${pkg.name}: ${splitSha || pkg.tempBranch} -> ${pkg.repo}#${pkg.branch}`)
}

console.log('Package repo sync complete.')

for (const line of pushed) {
  console.log(`- ${line}`)
}
