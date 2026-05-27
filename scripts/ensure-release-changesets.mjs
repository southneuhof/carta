import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { publishablePackageByName, publishablePackages } from './release-packages.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baseSha = process.env.BASE_SHA || process.argv.find((arg) => arg.startsWith('--base='))?.slice(7)
const headSha = process.env.HEAD_SHA || process.argv.find((arg) => arg.startsWith('--head='))?.slice(7) || 'HEAD'
const outputPath = process.env.GITHUB_OUTPUT

function runGit(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
}

function writeOutput(values) {
  if (!outputPath) return
  fs.appendFileSync(outputPath, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''))
}

function diffFiles() {
  const base = baseSha && !/^0+$/.test(baseSha) ? baseSha : `${headSha}~1`
  try {
    return runGit(['diff', '--name-only', `${base}...${headSha}`]).split('\n').filter(Boolean)
  } catch {
    return runGit(['diff', '--name-only', `${headSha}~1`, headSha]).split('\n').filter(Boolean)
  }
}

function readJson(relativeFile) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativeFile), 'utf8'))
}

function changedPackageNames(files) {
  return publishablePackages
    .filter((pkg) => files.some((file) => file === pkg.root || file.startsWith(`${pkg.root}/`)))
    .map((pkg) => pkg.name)
}

function changedChangesetFiles(files) {
  return files.filter((file) => /^\.changeset\/.+\.md$/.test(file) && !file.endsWith('/README.md'))
}

function workspacePublishableDependencies(pkgName) {
  const pkg = publishablePackageByName.get(pkgName)
  const manifest = readJson(`${pkg.root}/package.json`)
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  const deps = new Set()

  for (const section of sections) {
    for (const [name, range] of Object.entries(manifest[section] || {})) {
      if (publishablePackageByName.has(name) && String(range).startsWith('workspace:')) deps.add(name)
    }
  }

  return deps
}

function includeAffectedDependents(initialNames) {
  const selected = new Set(initialNames)
  let changed = true

  while (changed) {
    changed = false
    for (const pkg of publishablePackages) {
      if (selected.has(pkg.name)) continue
      const deps = workspacePublishableDependencies(pkg.name)
      if ([...selected].some((name) => deps.has(name))) {
        selected.add(pkg.name)
        changed = true
      }
    }
  }

  return [...selected]
}

function createPatchChangeset(packageNames) {
  const changesetDir = path.join(repoRoot, '.changeset')
  fs.mkdirSync(changesetDir, { recursive: true })
  const file = path.join(changesetDir, `auto-patch-${Date.now()}.md`)
  const frontmatter = packageNames.map((name) => `"${name}": patch`).join('\n')
  const body = `---\n${frontmatter}\n---\n\nAutomated patch release for changed framework packages.\n`
  fs.writeFileSync(file, body)
  console.log(`Created ${path.relative(repoRoot, file)} for ${packageNames.join(', ')}`)
}

const files = diffFiles()
const changedPackages = changedPackageNames(files)
const hasChangeset = changedChangesetFiles(files).length > 0
const releasePackages = hasChangeset ? changedPackages : includeAffectedDependents(changedPackages)

if (changedPackages.length > 0 && !hasChangeset) {
  createPatchChangeset(releasePackages)
}

writeOutput({
  changed_packages: changedPackages.join(','),
  release_packages: releasePackages.join(','),
  has_package_changes: changedPackages.length > 0 ? 'true' : 'false',
  has_changeset: hasChangeset ? 'true' : 'false',
  has_release_intent: changedPackages.length > 0 || hasChangeset ? 'true' : 'false',
  created_changeset: changedPackages.length > 0 && !hasChangeset ? 'true' : 'false',
})

console.log(`Changed publishable packages: ${changedPackages.join(', ') || '(none)'}`)
console.log(`Committed changeset present: ${hasChangeset ? 'yes' : 'no'}`)
