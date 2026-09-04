#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { moduleMetadata, validateConfig } from './scaffold-bounded-module.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function count(source, value) {
  return source.split(value).length - 1
}

function quoted(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r')}'`
}

function replaceOnce(source, anchor, replacement, name) {
  if (count(source, anchor) !== 1) throw new Error(`${name} anchor is missing or ambiguous.`)
  return source.replace(anchor, replacement)
}

function insertBeforeArrayEnd(source, startMarker, lines, name) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf('] as const', start)
  if (start < 0 || end < 0 || source.indexOf(startMarker, start + 1) >= 0) {
    throw new Error(`${name} section is missing or ambiguous.`)
  }
  const before = source.slice(0, end)
  return `${before}${before.endsWith('\n') ? '' : '\n'}${lines}\n${source.slice(end)}`
}

function insertRouteIndex(source, config) {
  const metadata = moduleMetadata(config)
  const importLine = `import { ${metadata.entity}Model, domain as ${metadata.plural}Domain } from './${config.slug}/${config.slug}'`
  const moduleLine = `  defineModule({ domain: ${metadata.plural}Domain, models: [${metadata.entity}Model] }),`
  if (count(source, importLine) > 1 || count(source, moduleLine) > 1) throw new Error(`route registration for "${config.slug}" is duplicated.`)
  if (!source.includes(importLine)) source = replaceOnce(source, '\nexport const modules = [', `\n${importLine}\n\nexport const modules = [`, 'route import')
  if (!source.includes(moduleLine)) source = insertBeforeArrayEnd(source, 'export const modules = [', moduleLine, 'modules')
  return source
}

function insertCatalog(source, config) {
  const codes = Object.values(moduleMetadata(config).permissions)
  const block = codes.map((code) => `  ${quoted(code)},`).join('\n')
  const sectionStart = source.indexOf('export const permissionCodes = [')
  const sectionEnd = source.indexOf('] as const', sectionStart)
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('permissionCodes section is missing.')
  const section = source.slice(sectionStart, sectionEnd)
  const present = codes.filter((code) => section.includes(quoted(code)))
  if (present.length === codes.length) return source
  if (present.length) throw new Error(`permissions for "${config.slug}" are incomplete.`)
  return insertBeforeArrayEnd(source, 'export const permissionCodes = [', block, 'permissionCodes')
}

function insertSeed(source, config) {
  if (!config.seed) return source
  const importLine = `import { seed${config.symbol} } from '../src/routes/${config.slug}/${config.slug}.seed'`
  const call = `  await seed${config.symbol}()`
  if (count(source, importLine) > 1 || count(source, call) > 1) throw new Error(`seed registration for "${config.slug}" is duplicated.`)
  if (!source.includes(importLine)) source = replaceOnce(source, 'const adminEmail', `${importLine}\n\nconst adminEmail`, 'seed import')
  if (!source.includes(call)) source = replaceOnce(source, 'async function seed() {', `async function seed() {\n${call}`, 'seed call')
  return source
}

function insertNavigation(source, config) {
  const metadata = moduleMetadata(config)
  const groupMarker = `name: '${config.navigation.group}'`
  const groupStart = source.indexOf(groupMarker)
  const routesStart = source.indexOf('    routes: [', groupStart)
  const groupEnd = source.indexOf('    ],\n  },', routesStart)
  if (groupStart < 0 || routesStart < 0 || groupEnd < 0 || source.indexOf(groupMarker, groupStart + 1) >= 0) {
    throw new Error(`navigation group "${config.navigation.group}" is missing or ambiguous.`)
  }
  const group = source.slice(groupStart, groupEnd)
  const marker = `to: { name: '${metadata.routes.list}' }`
  const desired = `      { to: { name: '${metadata.routes.list}' }, permission: '${metadata.permissions.list}', title: ${quoted(config.navigation.title)}, icon: ${quoted(config.navigation.icon)} },`
  if (count(group, marker) > 1) throw new Error(`navigation route "${metadata.routes.list}" is duplicated.`)
  if (group.includes(marker)) {
    if (!group.includes(desired)) throw new Error(`navigation route "${metadata.routes.list}" has different metadata.`)
    return source
  }
  const anchorMarker = `to: { name: '${config.navigation.anchor}' }`
  if (count(group, anchorMarker) !== 1) throw new Error(`navigation anchor "${config.navigation.anchor}" is missing or ambiguous.`)
  const anchor = group.indexOf(anchorMarker)
  const lineStart = group.lastIndexOf('\n', anchor) + 1
  const lineEnd = group.indexOf('\n', anchor)
  const separator = config.navigation.separator && !group.includes(`{ separator: ${quoted(config.navigation.separator)} }`)
    ? `      { separator: ${quoted(config.navigation.separator)} },\n`
    : ''
  const updated = config.navigation.position === 'before'
    ? `${group.slice(0, lineStart)}${separator}${desired}\n${group.slice(lineStart)}`
    : `${group.slice(0, lineEnd + 1)}${separator}${desired}\n${group.slice(lineEnd + 1)}`
  return source.slice(0, groupStart) + updated + source.slice(groupEnd)
}

function filePlan(root, config) {
  const files = [
    ['apps/api/src/routes/index.ts', (source) => insertRouteIndex(source, config)],
    ['apps/api/src/authorization/catalog.ts', (source) => insertCatalog(source, config)],
    ['apps/web/src/manifest/navigation.ts', (source) => insertNavigation(source, config)],
  ]
  if (config.seed) files.push(['apps/api/scripts/seed.ts', (source) => insertSeed(source, config)])
  return files.map(([path, edit]) => ({ path: resolve(root, path), edit }))
}

export function integrate(value, { root = repoRoot, apply = false } = {}) {
  const config = validateConfig(value)
  const changes = []
  for (const file of filePlan(resolve(root), config)) {
    if (!existsSync(file.path)) throw new Error(`Integration file does not exist: ${file.path}`)
    const before = readFileSync(file.path, 'utf8')
    const after = file.edit(before)
    if (after !== before) changes.push({ ...file, after })
  }
  if (apply) for (const change of changes) writeFileSync(change.path, change.after)
  return {
    status: changes.length ? (apply ? 'APPLIED' : 'PENDING') : (apply ? 'UP_TO_DATE' : 'READY'),
    changed: apply ? changes.map(({ path }) => path).sort() : [],
    pending: changes.map(({ path }) => path).sort(),
  }
}

function parseArgs(argv) {
  let manifest
  let root
  let apply = false
  let json = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--manifest' || argument === '--root') {
      const value = argv[++index]
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a path.`)
      if (argument === '--manifest') manifest = value
      else root = value
    } else if (argument === '--apply') apply = true
    else if (argument === '--check') apply = false
    else if (argument === '--json') json = true
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!manifest) throw new Error('Usage: node scripts/integrate-bounded-module.mjs --manifest <file.json> [--check|--apply] [--root <directory>] [--json]')
  return { manifest, root, apply, json }
}

export function execute(argv, { root = repoRoot, cwd = process.cwd() } = {}) {
  const args = parseArgs(argv)
  const manifest = JSON.parse(readFileSync(resolve(cwd, args.manifest), 'utf8'))
  const result = integrate(manifest, { root: args.root ? resolve(cwd, args.root) : root, apply: args.apply })
  return args.json ? JSON.stringify(result, null, 2) : `Status: ${result.status}`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(execute(process.argv.slice(2)))
  } catch (error) {
    console.error(`integrate-bounded-module: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
