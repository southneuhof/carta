import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build', '.svelte-kit', '.turbo'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, files)
    else files.push(full)
  }
  return files
}

const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
for (const file of tracked) {
  if (file.startsWith('.local/')) failures.push(`Tracked local-only file: ${file}`)
  if (/^apps\/landing-(hkr|admin-web)\/\.env($|\.)/.test(file) && !file.endsWith('.example')) failures.push(`Tracked real env file: ${file}`)
}

for (const app of ['apps/landing-mjl', 'apps/landing-admin-web']) {
  for (const file of collectFiles(path.join(repoRoot, app))) {
    if (!/\.(ts|js|json|vue|svelte|cjs|mjs)$/.test(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    if (/\.\.\/\.\.\/packages\/(apostle|is-data-model|is-vue-framework|landing-section-schema|landing-sveltekit-framework|utilities)\/src/.test(text)) {
      failures.push(`Hard-coded framework package path: ${path.relative(repoRoot, file)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Portable landing checks passed.')
