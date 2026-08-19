#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expectedGeneratedPaths, moduleMetadata, validateConfig } from './scaffold-master-data.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function quoted(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r')}'`
}

function html(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function read(path, checks, name) {
  if (!existsSync(path)) {
    checks.push({ name, status: 'FAIL', detail: `Missing file: ${path}` })
    return null
  }
  const contents = readFileSync(path, 'utf8')
  checks.push({ name, status: 'PASS', detail: path })
  return contents
}

function requireText(contents, text, checks, name) {
  if (contents === null) return
  checks.push({ name, status: contents.includes(text) ? 'PASS' : 'FAIL', detail: text })
}

function requireUniqueText(contents, text, checks, name) {
  if (contents === null) return
  const occurrences = contents.split(text).length - 1
  checks.push({ name, status: occurrences === 1 ? 'PASS' : 'FAIL', detail: `${text} (${occurrences} occurrences)` })
}

function staticVerify(value, { root = repoRoot } = {}) {
  const config = validateConfig(value)
  const outputRoot = resolve(root)
  const metadata = moduleMetadata(config)
  const checks = []
  const generated = expectedGeneratedPaths(config, { root: outputRoot })
  const missingGenerated = generated.filter((path) => !existsSync(path))
  checks.push({
    name: 'generated files',
    status: missingGenerated.length ? 'FAIL' : 'PASS',
    detail: missingGenerated.length ? `Missing: ${missingGenerated.join(', ')}` : `${generated.length} files present`,
  })

  const apiIndex = read(resolve(outputRoot, 'apps/api/src/routes/index.ts'), checks, 'API route index')
  requireUniqueText(apiIndex, `import { ${metadata.entity}Model, domain as ${metadata.plural}Domain } from "./${config.slug}/${config.slug}";`, checks, 'API route import')
  requireUniqueText(apiIndex, `  ${metadata.plural}Domain,`, checks, 'API domain registration')
  requireUniqueText(apiIndex, `  ${metadata.entity}Model,`, checks, 'API route registration')

  const catalog = read(resolve(outputRoot, 'apps/api/src/authorization/catalog.ts'), checks, 'authorization catalog')
  for (const action of ['view', 'list', 'detail', 'create', 'update', 'delete']) {
    requireUniqueText(catalog, `code: "${metadata.permissions[action]}"`, checks, `permission ${metadata.permissions[action]}`)
  }

  const navigation = read(resolve(outputRoot, 'apps/web/src/manifest/navigation.ts'), checks, 'web navigation')
  requireUniqueText(navigation, `to: { name: '${metadata.routes.list}' }`, checks, 'navigation route')
  requireText(navigation, `permission: '${metadata.permissions.view}'`, checks, 'navigation permission')
  requireText(navigation, `title: ${quoted(config.navigation.title)}`, checks, 'navigation title')

  const masterDataIndex = read(resolve(outputRoot, 'apps/web/src/routes/(authenticated)/master-data/index.route.vue'), checks, 'master-data index')
  requireUniqueText(masterDataIndex, `  ['${config.slug}', ${quoted(config.navigation.title)}],`, checks, 'master-data index entry')

  const routeFiles = [
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/index.route.vue`, `title="${html(config.labels.listTitle)}"`, 'list title'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/create.route.vue`, `title="${html(config.labels.createTitle)}"`, 'create title'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/create.route.vue`, `submit-label="${html(config.labels.submitLabel)}"`, 'create submit label'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/create.route.vue`, `successMessage: ${quoted(config.labels.createSuccessMessage)}`, 'create success message'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/[${metadata.routeParam}]/detail.route.vue`, `title="${html(config.labels.detailTitle)}"`, 'detail title'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/[${metadata.routeParam}]/edit.route.vue`, `title="${html(config.labels.editTitle)}"`, 'edit title'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/[${metadata.routeParam}]/edit.route.vue`, `submit-label="${html(config.labels.submitLabel)}"`, 'edit submit label'],
    [`apps/web/src/routes/(authenticated)/master-data/${config.slug}/[${metadata.routeParam}]/edit.route.vue`, `successMessage: ${quoted(config.labels.updateSuccessMessage)}`, 'update success message'],
  ]
  for (const [relativePath, text, name] of routeFiles) {
    const contents = read(resolve(outputRoot, relativePath), checks, name)
    requireText(contents, text, checks, `${name} content`)
  }

  if (config.seed) {
    const seedPath = resolve(outputRoot, `apps/api/src/routes/${config.slug}/${config.slug}.seed.ts`)
    const seed = read(seedPath, checks, 'module seed')
    requireText(seed, `export async function seed${config.symbol}()`, checks, 'module seed function')
    const seedOwner = read(resolve(outputRoot, 'apps/api/scripts/seed.ts'), checks, 'seed owner')
    requireUniqueText(seedOwner, `import { seed${config.symbol} } from '../src/routes/${config.slug}/${config.slug}.seed'`, checks, 'seed owner import')
    requireUniqueText(seedOwner, `  await seed${config.symbol}()`, checks, 'seed owner call')
  }

  const failed = checks.filter((check) => check.status === 'FAIL')
  return { status: failed.length ? 'FAIL' : 'PASS', checks, failed }
}

function commandText(command, args) {
  return [command, ...args].join(' ')
}

function runCommand(command, args, { cwd }) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  return {
    command: commandText(command, args),
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exitCode: result.status ?? 1,
    output: output.slice(-3000),
  }
}

function runChecks(config, { root, withSeed }) {
  const slug = config.slug
  const apiRouteFiles = [
    `src/routes/${slug}/${slug}.entity.ts`,
    `src/routes/${slug}/${slug}.ts`,
    `src/routes/${slug}/${slug}.routes.spec.ts`,
    'src/routes/index.ts',
    'src/authorization/catalog.ts',
  ]
  if (config.seed) apiRouteFiles.push(`src/routes/${slug}/${slug}.seed.ts`, 'scripts/seed.ts')
  const webFiles = [
    `src/routes/(authenticated)/master-data/${slug}/${slug}.schema.ts`,
    `src/routes/(authenticated)/master-data/${slug}/${slug}.resource.ts`,
    `src/routes/(authenticated)/master-data/${slug}/${slug}.resource.spec.ts`,
    `src/routes/(authenticated)/master-data/${slug}/${slug}.integration.spec.ts`,
    `src/routes/(authenticated)/master-data/${slug}/index.route.vue`,
    `src/routes/(authenticated)/master-data/${slug}/create.route.vue`,
    `src/routes/(authenticated)/master-data/${slug}/[${moduleMetadata(config).routeParam}]/detail.route.vue`,
    `src/routes/(authenticated)/master-data/${slug}/[${moduleMetadata(config).routeParam}]/edit.route.vue`,
    'src/manifest/navigation.ts',
    'src/routes/(authenticated)/master-data/index.route.vue',
  ]
  const specs = [
    ['pnpm', ['--filter', '@southneuhof/api', 'test:focused', '--', `src/routes/${slug}/${slug}.routes.spec.ts`]],
    ['pnpm', ['--filter', '@southneuhof/framework-web', 'test:focused', '--', `routes/(authenticated)/master-data/${slug}/${slug}.resource.spec.ts`, `routes/(authenticated)/master-data/${slug}/${slug}.integration.spec.ts`]],
    ['pnpm', ['--filter', '@southneuhof/api', 'lint:focused', '--', ...apiRouteFiles]],
    ['pnpm', ['--filter', '@southneuhof/framework-web', 'lint:focused', '--', ...webFiles]],
    ['pnpm', ['--filter', '@southneuhof/api', 'type-check']],
    ['pnpm', ['--filter', '@southneuhof/framework-web', 'type-check']],
    ['git', ['diff', '--check']],
  ]
  if (withSeed) specs.push(['pnpm', ['--filter', '@southneuhof/api', 'db:seed']])
  if (withSeed) specs.push(['pnpm', ['--filter', '@southneuhof/api', 'db:seed']])
  const commands = []
  for (const [command, args] of specs) {
    const result = runCommand(command, args, { cwd: root })
    commands.push(result)
    if (result.status === 'FAIL') break
  }
  return commands
}

export function verify(value, { root = repoRoot, run = false, withSeed = false } = {}) {
  const config = validateConfig(value)
  if (withSeed && !config.seed) throw new Error('--with-seed requires a manifest seed block.')
  const outputRoot = resolve(root)
  const staticResult = staticVerify(config, { root: outputRoot })
  const commands = staticResult.status === 'PASS' && run ? runChecks(config, { root: outputRoot, withSeed }) : []
  const commandFailure = commands.find((command) => command.status === 'FAIL')
  return {
    status: staticResult.status === 'PASS' && !commandFailure ? 'PASS' : 'FAIL',
    static: staticResult,
    commands,
    browser: {
      required: true,
      paths: [
        `/master-data/${config.slug}`,
        `/master-data/${config.slug}/create`,
        `/master-data/${config.slug}/${config.seed?.records[0]?.[config.identity.key] ?? 'record-1'}/detail`,
        `/master-data/${config.slug}/${config.seed?.records[0]?.[config.identity.key] ?? 'record-1'}/edit`,
      ],
    },
  }
}

function parseArgs(argv) {
  let manifest
  let root
  let run = false
  let withSeed = false
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
    } else if (argument === '--run') {
      run = true
    } else if (argument === '--check-only') {
      if (run) throw new Error('Choose only one of --check-only or --run.')
    } else if (argument === '--with-seed') {
      withSeed = true
    } else if (argument === '--json') {
      json = true
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (!manifest) throw new Error('Usage: node scripts/verify-module.mjs --manifest <file.json> [--check-only|--run] [--with-seed] [--root <directory>] [--json]')
  return { manifest, root, run, withSeed, json }
}

function output(result, json) {
  if (json) return JSON.stringify(result, null, 2)
  return [
    `MODULE ${result.status}`,
    `Static checks: ${result.static.status}`,
    ...result.static.checks.map((check) => `- ${check.status}: ${check.name}`),
    ...(result.commands.length ? ['Commands:', ...result.commands.map((command) => `- ${command.status}: ${command.command}`)] : []),
    '',
    'Authenticated browser paths to verify:',
    ...result.browser.paths.map((path) => `- ${path}`),
    'Browser verification and $verify-ads-hk-module PASS remain required.',
  ].join('\n')
}

export function execute(argv, { root = repoRoot, cwd = process.cwd() } = {}) {
  const { manifest, root: outputRoot, run, withSeed, json } = parseArgs(argv)
  const manifestPath = resolve(cwd, manifest)
  let config
  try {
    config = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Cannot read module manifest ${manifestPath}: ${message}`)
  }
  return output(verify(config, { root: outputRoot ? resolve(cwd, outputRoot) : root, run, withSeed }), json)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = execute(process.argv.slice(2))
    console.log(result)
    if (result.startsWith('MODULE FAIL') || result.includes('"status": "FAIL"')) process.exitCode = 1
  } catch (error) {
    console.error(`verify-module: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
