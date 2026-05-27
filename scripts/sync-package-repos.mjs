import { execFileSync } from 'node:child_process'
import { publishablePackages as packages } from './release-packages.mjs'

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
  console.log(`Syncing ${pkg.name} from ${pkg.root}`)
  cleanupTempBranch(pkg.tempBranch)

  const splitSha = run(`git subtree split --prefix=${pkg.root} -b ${pkg.tempBranch}`)
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
