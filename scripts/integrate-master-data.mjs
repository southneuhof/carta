#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { moduleMetadata, validateConfig } from './scaffold-master-data.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function count(source, value) {
  return source.split(value).length - 1
}

function quoted(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r')}'`
}

function jsonQuoted(value) {
  return JSON.stringify(value)
}

function section(source, startMarker, endMarker, name) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (start < 0 || end < 0 || source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error(`${name} section anchor is missing or ambiguous.`)
  }
  return { start, end: end + endMarker.length }
}

function addBeforeClose(source, closeIndex, line) {
  const before = source.slice(0, closeIndex)
  const separator = before.endsWith('\n') ? '' : '\n'
  return `${before}${separator}${line}\n${source.slice(closeIndex)}`
}

function replaceOnce(source, anchor, replacement, name) {
  if (count(source, anchor) !== 1) throw new Error(`${name} anchor is missing or ambiguous.`)
  return source.replace(anchor, replacement)
}

function insertRouteIndex(source, config) {
  const metadata = moduleMetadata(config)
  const importLine = `import { ${metadata.entity}Model, domain as ${metadata.plural}Domain } from "./${config.slug}/${config.slug}";`
  const domainLine = `  ${metadata.plural}Domain,`
  const modelLine = `  ${metadata.entity}Model,`

  if (count(source, importLine) > 1) throw new Error(`route import for "${config.slug}" is duplicated.`)
  if (count(source, domainLine) > 1) throw new Error(`domain registration for "${config.slug}" is duplicated.`)
  if (count(source, modelLine) > 1) throw new Error(`route registration for "${config.slug}" is duplicated.`)

  if (!source.includes(importLine)) {
    source = replaceOnce(source, 'export const domainParts = [', `${importLine}\n\nexport const domainParts = [`, 'route import')
  }

  const domain = section(source, 'export const domainParts = [', '] as const;', 'domainParts')
  if (!source.includes(domainLine)) source = addBeforeClose(source, domain.end - '] as const;'.length, domainLine)
  const installed = section(source, 'const installedRoutes = [', '] as const;', 'installedRoutes')
  if (!source.includes(modelLine)) source = addBeforeClose(source, installed.end - '] as const;'.length, modelLine)
  return source
}

function catalogBlock(config) {
  const metadata = moduleMetadata(config)
  const permissions = ['view', 'list', 'detail', 'create', 'update', 'delete'].map((action) => {
    const entry = config.permissions.entries[action]
    return `      { code: ${jsonQuoted(metadata.permissions[action])}, name: ${jsonQuoted(entry.name)}, description: ${jsonQuoted(entry.description)}, active: true },`
  }).join('\n')
  return `  {
    code: ${jsonQuoted(config.slug)},
    name: ${jsonQuoted(config.permissions.moduleName)},
    realm: ${jsonQuoted(config.permissions.realm)},
    active: true,
    permissions: [
${permissions}
    ],
  },`
}

function insertCatalog(source, config) {
  const block = catalogBlock(config)
  const codeLine = `    code: ${jsonQuoted(config.slug)},`
  const endMarker = '] as const satisfies readonly ModuleDefinition[];'
  const modules = section(source, 'export const authorizationModules = [', endMarker, 'authorizationModules')
  const body = source.slice(modules.start, modules.end)
  if (count(body, codeLine) > 1) throw new Error(`authorization module "${config.slug}" is duplicated.`)
  if (body.includes(codeLine)) {
    if (!body.includes(block)) throw new Error(`authorization module "${config.slug}" already exists with different metadata.`)
    return source
  }
  return addBeforeClose(source, modules.end - endMarker.length, block)
}

function insertSeed(source, config) {
  if (!config.seed) return source
  const importLine = `import { seed${config.symbol} } from '../src/routes/${config.slug}/${config.slug}.seed'`
  const call = `  await seed${config.symbol}()`
  if (count(source, importLine) > 1) throw new Error(`seed import for "${config.slug}" is duplicated.`)
  if (count(source, call) > 1) throw new Error(`seed call for "${config.slug}" is duplicated.`)
  if (!source.includes(importLine)) source = replaceOnce(source, 'const seedEmail', `${importLine}\n\nconst seedEmail`, 'seed import')
  if (!source.includes(call)) source = replaceOnce(source, '  await seedAuthorization()', `  await seedAuthorization()\n${call}`, 'seed call')
  return source
}

function masterDataSection(source) {
  return section(source, 'const entries = [', '] as const', 'master-data entries')
}

function insertNavigation(source, config) {
  const metadata = moduleMetadata(config)
  const masterStart = source.indexOf("name: 'master-data'")
  const masterEnd = source.indexOf("    ],\n  },\n] as const", masterStart)
  if (masterStart < 0 || masterEnd < 0 || source.indexOf("name: 'master-data'", masterStart + 1) >= 0) {
    throw new Error('master-data navigation section anchor is missing or ambiguous.')
  }
  const master = source.slice(masterStart, masterEnd)
  const routeMarker = `to: { name: '${metadata.routes.list}' }`
  const desired = `      { to: { name: '${metadata.routes.list}' }, permission: '${metadata.permissions.view}', title: ${quoted(config.navigation.title)}, icon: 'folder' },`
  if (count(master, routeMarker) > 1) throw new Error(`navigation route "${metadata.routes.list}" is duplicated.`)
  if (master.includes(routeMarker)) {
    if (!master.includes(desired)) throw new Error(`navigation route "${metadata.routes.list}" already exists with different metadata.`)
    return source
  }

  const afterMarker = `to: { name: '${config.navigation.after}' }`
  if (count(master, afterMarker) !== 1) throw new Error(`navigation.after "${config.navigation.after}" anchor is missing or ambiguous.`)
  const afterStart = master.indexOf(afterMarker)
  const afterEnd = master.indexOf('\n', afterStart)
  const separator = config.navigation.separator ? `      { separator: ${quoted(config.navigation.separator)} },\n` : ''
  const existingSeparator = config.navigation.separator ? `      { separator: ${quoted(config.navigation.separator)} },` : null
  const insertion = afterEnd
  const prefix = existingSeparator && master.includes(existingSeparator) ? '' : separator
  const updatedMaster = `${master.slice(0, insertion)}\n${prefix}${desired}${master.slice(insertion)}`
  return source.slice(0, masterStart) + updatedMaster + source.slice(masterEnd)
}

function insertMasterDataEntry(source, config) {
  const entry = `  ['${config.slug}', ${quoted(config.navigation.title)}],`
  const marker = `  ['${config.slug}',`
  const entries = masterDataSection(source)
  const body = source.slice(entries.start, entries.end)
  if (count(body, marker) > 1) throw new Error(`master-data entry "${config.slug}" is duplicated.`)
  if (body.includes(marker)) {
    if (!body.includes(entry)) throw new Error(`master-data entry "${config.slug}" already exists with different metadata.`)
    return source
  }
  const after = `  ['${config.navigation.after.replace(/^master-data-/, '')}',`
  if (count(body, after) !== 1) throw new Error(`master-data index anchor "${config.navigation.after}" is missing or ambiguous.`)
  const afterStart = body.indexOf(after)
  const afterEnd = body.indexOf('\n', afterStart)
  const updatedBody = `${body.slice(0, afterEnd)}\n${entry}${body.slice(afterEnd)}`
  return source.slice(0, entries.start) + updatedBody + source.slice(entries.end)
}

function filePlan(root, config) {
  const files = [
    ['apps/api/src/routes/index.ts', (source) => insertRouteIndex(source, config)],
    ['apps/api/src/authorization/catalog.ts', (source) => insertCatalog(source, config)],
    ['apps/web/src/manifest/navigation.ts', (source) => insertNavigation(source, config)],
    ['apps/web/src/routes/(authenticated)/master-data/index.route.vue', (source) => insertMasterDataEntry(source, config)],
  ]
  if (config.seed) files.push(['apps/api/scripts/seed.ts', (source) => insertSeed(source, config)])
  return files.map(([relativePath, edit]) => ({ path: resolve(root, relativePath), edit }))
}

export function integrate(value, { root = repoRoot, apply = false } = {}) {
  const config = validateConfig(value)
  const changes = []
  for (const file of filePlan(resolve(root), config)) {
    if (!existsSync(file.path)) throw new Error(`Integration file does not exist: ${file.path}`)
    const before = readFileSync(file.path, 'utf8')
    const after = file.edit(before)
    if (after !== before) changes.push({ ...file, before, after })
  }

  if (apply) {
    for (const change of changes) writeFileSync(change.path, change.after)
  }

  return {
    status: changes.length === 0 ? (apply ? 'UP_TO_DATE' : 'READY') : (apply ? 'APPLIED' : 'PENDING'),
    changed: apply ? changes.map((change) => change.path).sort() : [],
    pending: changes.map((change) => change.path).sort(),
  }
}

function parseArgs(argv) {
  let manifest
  let root
  let mode
  let json = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--manifest') {
      manifest = argv[index + 1]
      index += 1
      if (!manifest || manifest.startsWith('--')) throw new Error('--manifest requires a JSON file path.')
    } else if (argument === '--root') {
      root = argv[index + 1]
      index += 1
      if (!root || root.startsWith('--')) throw new Error('--root requires a repository directory.')
    } else if (argument === '--check' || argument === '--apply') {
      if (mode) throw new Error('Choose only one of --check or --apply.')
      mode = argument.slice(2)
    } else if (argument === '--json') {
      json = true
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (!manifest) throw new Error('Usage: node scripts/integrate-master-data.mjs --manifest <file.json> [--check|--apply] [--root <directory>] [--json]')
  return { manifest, root, mode: mode ?? 'check', json }
}

function output(result, json) {
  if (json) return JSON.stringify(result, null, 2)
  return [
    `Status: ${result.status}`,
    ...(result.changed.length ? ['Changed files:', ...result.changed.map((path) => `- ${path}`)] : []),
    ...(result.pending.length ? ['Pending files:', ...result.pending.map((path) => `- ${path}`)] : []),
  ].join('\n')
}

export function execute(argv, { root = repoRoot, cwd = process.cwd() } = {}) {
  const { manifest, root: outputRoot, mode, json } = parseArgs(argv)
  const manifestPath = resolve(cwd, manifest)
  let config
  try {
    config = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Cannot read module manifest ${manifestPath}: ${message}`)
  }
  return output(integrate(config, { root: outputRoot ? resolve(cwd, outputRoot) : root, apply: mode === 'apply' }), json)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(execute(process.argv.slice(2)))
  } catch (error) {
    console.error(`integrate-master-data: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
