#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/
const symbolPattern = /^[A-Z][A-Za-z0-9]*$/
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const tablePattern = /^[a-z][a-z0-9_]*$/
const supportedTypes = new Set(['text', 'boolean'])
const permissionActions = ['view', 'list', 'detail', 'create', 'update', 'delete']
const labelKeys = ['listTitle', 'detailTitle', 'createTitle', 'editTitle', 'submitLabel', 'createSuccessMessage', 'updateSuccessMessage']
const renderersByType = {
  text: new Set(['text', 'textarea']),
  boolean: new Set(['checkbox', 'radio', 'switch']),
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} is required.`)
  return value.trim()
}

function identifier(value, name) {
  const result = requiredString(value, name)
  if (!identifierPattern.test(result)) throw new Error(`${name} must be a valid identifier.`)
  return result
}

function databaseName(value, name, fallback) {
  const result = value === undefined ? fallback : requiredString(value, name)
  if (!tablePattern.test(result)) throw new Error(`${name} must be a valid database identifier.`)
  return result
}

function snakeCase(value) {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}

function validateOptions(field) {
  if (field.options === undefined) return
  if (!Array.isArray(field.options)) throw new Error(`Field "${field.key}" options must be an array.`)
  for (const [index, option] of field.options.entries()) {
    if (!isObject(option) || !('id' in option) || typeof option.name !== 'string' || option.name.trim() === '') {
      throw new Error(`Field "${field.key}" option ${index + 1} must have id and name.`)
    }
    if (field.type === 'boolean' && typeof option.id !== 'boolean') {
      throw new Error(`Field "${field.key}" option ${index + 1} id must be boolean.`)
    }
    if (field.type === 'text' && typeof option.id !== 'string') {
      throw new Error(`Field "${field.key}" option ${index + 1} id must be text.`)
    }
  }
}

function validateLabels(value) {
  if (!isObject(value)) throw new Error('labels is required.')
  const labels = Object.fromEntries(labelKeys.map((key) => [key, requiredString(value[key], `labels.${key}`)]))
  return labels
}

function validatePermissions(value) {
  if (!isObject(value)) throw new Error('permissions is required.')
  const moduleName = requiredString(value.moduleName, 'permissions.moduleName')
  const realm = requiredString(value.realm, 'permissions.realm')
  if (!new Set(['system', 'project']).has(realm)) throw new Error('permissions.realm must be system or project.')
  if (!isObject(value.entries)) throw new Error('permissions.entries is required.')
  const entries = Object.fromEntries(permissionActions.map((action) => {
    const entry = value.entries[action]
    if (!isObject(entry)) throw new Error(`permissions.entries.${action} is required.`)
    return [action, {
      name: requiredString(entry.name, `permissions.entries.${action}.name`),
      description: requiredString(entry.description, `permissions.entries.${action}.description`),
    }]
  }))
  return { moduleName, realm, entries }
}

function validateNavigation(value) {
  if (!isObject(value)) throw new Error('navigation is required.')
  const after = requiredString(value.after, 'navigation.after')
  if (!after.startsWith('master-data-')) throw new Error('navigation.after must be a master-data route name.')
  const title = requiredString(value.title, 'navigation.title')
  const icon = requiredString(value.icon, 'navigation.icon')
  if (icon !== 'folder') throw new Error('navigation.icon must be folder for simple master data.')
  if (value.separator !== undefined && value.separator !== null) requiredString(value.separator, 'navigation.separator')
  return { after, title, icon, separator: value.separator ?? null }
}

function validateSeed(value, { identity, fields }) {
  if (value === undefined) return null
  if (!isObject(value)) throw new Error('seed must be an object when provided.')
  if (!Array.isArray(value.records) || value.records.length === 0) throw new Error('seed.records must be a non-empty array when seed is provided.')
  if (!Array.isArray(value.updateFields) || value.updateFields.length === 0) throw new Error('seed.updateFields must be a non-empty array when seed is provided.')
  const allowedKeys = new Set([identity.key, ...fields.map((field) => field.key)])
  const updateFields = value.updateFields.map((key, index) => identifier(key, `seed.updateFields[${index}]`))
  if (new Set(updateFields).size !== updateFields.length) throw new Error('seed.updateFields must be unique.')
  for (const key of updateFields) {
    if (!allowedKeys.has(key) || key === identity.key) throw new Error(`seed.updateFields contains unsupported field "${key}".`)
  }
  const records = value.records.map((record, index) => {
    if (!isObject(record)) throw new Error(`seed.records[${index}] must be an object.`)
    if (!Object.hasOwn(record, identity.key)) throw new Error(`seed.records[${index}] must include ${identity.key}.`)
    for (const key of Object.keys(record)) {
      if (!allowedKeys.has(key)) throw new Error(`seed.records[${index}] contains unsupported field "${key}".`)
    }
    return record
  })
  return { records, updateFields }
}

function validateField(value, name, { domain }) {
  if (!isObject(value)) throw new Error(`${name} must be an object.`)
  const key = identifier(value.key, `${name}.key`)
  const type = requiredString(value.type, `${name}.type`)
  if (!supportedTypes.has(type)) throw new Error(`${name}.type "${type}" is unsupported; use text or boolean.`)

  if (domain) {
    requiredString(value.label, `${name}.label`)
    const renderer = requiredString(value.renderer, `${name}.renderer`)
    if (!renderersByType[type].has(renderer)) throw new Error(`${name}.renderer "${renderer}" is not valid for ${type}.`)
  }

  if (value.required !== undefined && typeof value.required !== 'boolean') throw new Error(`${name}.required must be boolean.`)
  if (Object.hasOwn(value, 'default')) {
    const expected = type === 'boolean' ? 'boolean' : 'string'
    if (typeof value.default !== expected) throw new Error(`${name}.default must be ${expected}.`)
  }
  if (value.column !== undefined) databaseName(value.column, `${name}.column`, '')
  validateOptions({ ...value, key, type })

  return {
    ...value,
    key,
    type,
    column: databaseName(value.column, `${name}.column`, snakeCase(key)),
  }
}

export function validateConfig(value) {
  if (!isObject(value)) throw new Error('Scaffold configuration must be a JSON object.')

  if (value.kind !== 'simple-master-data') throw new Error('kind must be simple-master-data.')
  const slug = requiredString(value.slug, 'slug')
  if (!slugPattern.test(slug)) throw new Error('slug must contain lowercase letters, numbers, and single hyphens.')
  const table = databaseName(requiredString(value.table, 'table'), 'table', '')
  const symbol = requiredString(value.symbol, 'symbol')
  if (!symbolPattern.test(symbol)) throw new Error('symbol must be a PascalCase identifier.')
  const title = requiredString(value.title, 'title')

  if (!isObject(value.identity)) throw new Error('identity is required.')
  const identity = {
    ...value.identity,
    key: identifier(value.identity.key, 'identity.key'),
    type: requiredString(value.identity.type, 'identity.type'),
    column: databaseName(value.identity.column, 'identity.column', snakeCase(value.identity.key)),
  }
  if (identity.type !== 'text') throw new Error('identity.type must be text.')
  if (identity.primary !== true) throw new Error('identity.primary must be true.')
  if (identity.generated !== 'uuid') throw new Error('identity.generated must be uuid.')

  if (!Array.isArray(value.fields) || value.fields.length === 0) throw new Error('fields must be a non-empty array.')
  const fields = value.fields.map((field, index) => validateField(field, `fields[${index}]`, { domain: true }))
  const explicitFields = (key) => {
    if (value[key] === undefined) return []
    if (!Array.isArray(value[key])) throw new Error(`${key} must be an array when provided.`)
    return value[key].map((field, index) => validateField(field, `${key}[${index}]`, { domain: false }))
  }
  const serverFields = explicitFields('serverFields')
  const auditFields = explicitFields('auditFields')
  const keys = [identity.key, ...fields, ...serverFields, ...auditFields].map((field) => typeof field === 'string' ? field : field.key)
  if (new Set(keys).size !== keys.length) throw new Error('Field keys, including identity and server fields, must be unique.')

  const labels = validateLabels(value.labels)
  if (labels.listTitle !== title) throw new Error('labels.listTitle must match title.')
  const permissions = validatePermissions(value.permissions)
  const navigation = validateNavigation(value.navigation)
  const seed = validateSeed(value.seed, { identity, fields })

  return { kind: value.kind, slug, table, symbol, title, identity, fields, serverFields, auditFields, labels, permissions, navigation, seed }
}

function literal(value) {
  if (typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r')}'`
  return JSON.stringify(value)
}

function lowerCamel(symbol) {
  return `${symbol[0].toLowerCase()}${symbol.slice(1)}`
}

export function moduleMetadata(config) {
  const entity = lowerCamel(config.symbol)
  const routeParam = `${entity}Id`
  const routes = {
    list: `master-data-${config.slug}`,
    detail: `master-data-${config.slug}-detail`,
    create: `master-data-${config.slug}-create`,
    edit: `master-data-${config.slug}-edit`,
  }
  const permissions = Object.fromEntries(permissionActions.map((action) => [action, `${action}-${config.slug}`]))
  return { entity, plural: `${entity}s`, routeParam, routes, permissions }
}

function html(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function tableColumn(field) {
  const modifiers = []
  if (field.required) modifiers.push('notNull()')
  if (Object.hasOwn(field, 'default')) modifiers.push(`default(${literal(field.default)})`)
  return `${field.key}: ${field.type}(${literal(field.column)})${modifiers.map((modifier) => `.${modifier}`).join('')},`
}

function renderEntity(config) {
  const allFields = [...config.fields, ...config.serverFields, ...config.auditFields]
  const imports = ['boolean', 'pgTable', 'text'].filter((value) => value !== 'boolean' || allFields.some((field) => field.type === 'boolean'))
  const identity = `${config.identity.key}: text(${literal(config.identity.column)}).primaryKey().$defaultFn(() => crypto.randomUUID()),`
  const writeKeys = [config.identity.key, ...config.serverFields, ...config.auditFields].map((field) => typeof field === 'string' ? field : field.key)
  const write = writeKeys.map((key) => `${key}: true`).join(', ')
  const plural = `${lowerCamel(config.symbol)}s`

  return `import { createEntity } from '@southneuhof/sprindle/entity'
import { ${imports.join(', ')} } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const ${plural} = pgTable(${literal(config.table)}, {
  ${identity}
${allFields.map(tableColumn).map((line) => `  ${line}`).join('\n')}
})

const write = { ${write} } as const

export const ${lowerCamel(config.symbol)} = createEntity({
  table: ${plural},
  schemas: {
    create: createInsertSchema(${plural}).omit(write),
    update: createUpdateSchema(${plural}).omit(write),
    select: createSelectSchema(${plural}),
  },
})
`
}

function renderRoute(config) {
  const plural = `${lowerCamel(config.symbol)}s`
  const entity = lowerCamel(config.symbol)
  const metadata = moduleMetadata(config)
  return `import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import { ${plural}, ${entity} } from './${config.slug}.entity'

const listAccess = [authenticated(), requirePermission('${metadata.permissions.list}')]
const detailAccess = [authenticated(), requirePermission('${metadata.permissions.detail}')]
const createAccess = [authenticated(), requirePermission('${metadata.permissions.create}')]
const updateAccess = [authenticated(), requirePermission('${metadata.permissions.update}')]
const deleteAccess = [authenticated(), requirePermission('${metadata.permissions.delete}')]

export const domain = defineDomainPart({ tables: { ${plural} }, entities: [${entity}] })

export const ${entity}Model = defineModel({
  path: '/${config.slug}',
  entity: ${entity},
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: create({ authorize: createAccess }),
    update: update({ authorize: updateAccess }),
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
`
}

function renderRouteTest(config) {
  return `import { describe, expect, it } from 'vitest'
import { app } from '../../app'

describe(${literal(`${config.title} routes`)}, () => {
  it('requires authentication', async () => {
    expect((await app.request('/${config.slug}/list')).status).toBe(401)
  })
})
`
}

function renderSeed(config) {
  if (!config.seed) return null
  const entity = lowerCamel(config.symbol)
  const plural = `${entity}s`
  const rows = config.seed.records.map((record) => {
    const values = Object.entries(record).map(([key, value]) => `${key}: ${literal(value)}`).join(', ')
    return `  { ${values} },`
  }).join('\n')
  const updates = config.seed.updateFields.map((key) => `${key}: sql\`excluded.${config.fields.find((field) => field.key === key).column}\``).join(', ')
  return `import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { ${plural} } from './${config.slug}.entity'

const records = [
${rows}
] as const

export async function seed${config.symbol}() {
  const db = getDb()
  await db.insert(${plural}).values(records).onConflictDoUpdate({
    target: ${plural}.${config.identity.key},
    set: { ${updates} },
  })
}
`
}

function renderSchema(config) {
  const entity = lowerCamel(config.symbol)
  const plural = `${entity}s`
  return `import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { ${entity} } from '@southneuhof/api/routes/${config.slug}/${config.slug}.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ${config.symbol} = z.output<typeof ${entity}.schemas.select>
export type ${config.symbol}Create = z.input<typeof ${entity}.schemas.create>
export type ${config.symbol}Update = z.input<typeof ${entity}.schemas.update>

export const ${plural}Schema = defineSchema<AppResourceContract<typeof rpc['${config.slug}']>>({
  identity: ${literal(config.identity.key)},
  record: { schema: fromZod(${entity}.schemas.select) },
  create: { schema: fromZod(${entity}.schemas.create) },
  update: { schema: fromZod(${entity}.schemas.update) },
})
`
}

function renderField(field) {
  const formParts = [`renderer: ${literal(field.renderer)}`]
  if (field.options) formParts.push(`source: ${literal(field.options)} as const`)
  if (field.required) formParts.push('props: { required: true }')
  return `  ${field.key}: { label: ${literal(field.label)}, form: { ${formParts.join(', ')} } },`
}

function renderResource(config) {
  const entity = lowerCamel(config.symbol)
  const plural = `${entity}s`
  const metadata = moduleMetadata(config)
  const routeParam = metadata.routeParam
  const fieldKeys = config.fields.map((field) => `fields.${field.key}`).join(', ')
  const initial = config.fields
    .filter((field) => Object.hasOwn(field, 'default'))
    .map((field) => `${field.key}: ${literal(field.default)}`)
    .join(', ')
  const initialData = initial ? `\n      initialData: { ${initial} },` : ''

  return `import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { ${plural}Schema } from './${config.slug}.schema'

const api = createHonoResourceActions(rpc['${config.slug}'], dataAdapter)

const fields = defineFields(${plural}Schema, {
${config.fields.map(renderField).join('\n')}
})

export const ${plural} = defineResource(${plural}Schema, {
  key: '${config.slug}',
  actions: {
    list: {
      run: api.list,
      fields: [${fieldKeys}],
      permission: '${metadata.permissions.view}',
      route: { name: '${metadata.routes.list}' },
    },
    detail: {
      run: api.detail,
      fields: [${fieldKeys}],
      permission: '${metadata.permissions.view}',
      route: { name: '${metadata.routes.detail}', params: (id) => ({ ${routeParam}: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [${fieldKeys}],
      permission: '${metadata.permissions.create}',
      route: { name: '${metadata.routes.create}' },${initialData}
    },
    update: {
      run: api.update,
      fields: [${fieldKeys}],
      permission: '${metadata.permissions.update}',
      route: { name: '${metadata.routes.edit}', params: (id) => ({ ${routeParam}: String(id) }) },
    },
    delete: { run: api.delete, permission: '${metadata.permissions.delete}' },
  },
})

export type { ${config.symbol}, ${config.symbol}Create, ${config.symbol}Update } from './${config.slug}.schema'
`
}

function renderResourceTest(config) {
  const entity = lowerCamel(config.symbol)
  const plural = `${entity}s`
  const metadata = moduleMetadata(config)
  const routeParam = metadata.routeParam
  const keys = literal(config.fields.map((field) => field.key))
  return `import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { ${plural} } from './${config.slug}.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe(${literal(`${config.title} resource`)}, () => {
  it('exposes only the configured domain fields', () => {
    const keys = ${keys}
    expect(fields(${plural}.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(${plural}.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    expect(fields(${plural}.create().fields, 'form').map((field) => field.key)).toEqual(keys)
  })

  it('maps standard CRUD routes', () => {
    const list = ${plural}.list()
    expect(list.createRoute).toEqual({ name: '${metadata.routes.create}' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: '${metadata.routes.detail}', params: { ${routeParam}: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: '${metadata.routes.edit}', params: { ${routeParam}: '1' } })
    expect(${plural}.delete({ id: '1' })).toHaveProperty('run')
  })
})
`
}

function renderRoutes(config) {
  const entity = lowerCamel(config.symbol)
  const plural = `${entity}s`
  const metadata = moduleMetadata(config)
  const routeParam = metadata.routeParam
  const listTitle = html(config.labels.listTitle)
  const detailTitle = html(config.labels.detailTitle)
  const createTitle = html(config.labels.createTitle)
  const editTitle = html(config.labels.editTitle)
  const submitLabel = html(config.labels.submitLabel)
  return {
    index: `<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { ${plural} } from './${config.slug}.resource'
</script>

<template><ListView v-bind="${plural}.list()" title="${listTitle}" /></template>
`,
    create: `<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { ${plural} } from './${config.slug}.resource'

const form = { ...${plural}.create(), successMessage: ${literal(config.labels.createSuccessMessage)} }
</script>

<template><FormView v-bind="form" title="${createTitle}" submit-label="${submitLabel}" /></template>
`,
    detail: `<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { ${plural} } from '../${config.slug}.resource'

const route = useRoute('master-data-${config.slug}-detail')
</script>

<template><DetailView v-bind="${plural}.detail({ id: String(route.params.${routeParam}) })" title="${detailTitle}" :back-to="{ name: '${metadata.routes.list}' }" /></template>
`,
    edit: `<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { ${plural} } from '../${config.slug}.resource'

const route = useRoute('${metadata.routes.edit}')
const form = { ...${plural}.update({ id: String(route.params.${routeParam}) }), successMessage: ${literal(config.labels.updateSuccessMessage)} }
</script>

<template><FormView v-bind="form" title="${editTitle}" submit-label="${submitLabel}" /></template>
`,
  }
}

function renderIntegrationTest(config) {
  const metadata = moduleMetadata(config)
  return `import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe(${literal(`${config.title} route integration`)}, () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/${config.slug}').name).toBe('${metadata.routes.list}')
    expect(router.resolve('/master-data/${config.slug}/create').name).toBe('${metadata.routes.create}')
    expect(router.resolve('/master-data/${config.slug}/record-1/detail').name).toBe('${metadata.routes.detail}')
    expect(router.resolve('/master-data/${config.slug}/record-1/edit').name).toBe('${metadata.routes.edit}')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: '${metadata.routes.list}' },
      permission: '${metadata.permissions.view}',
      title: ${literal(config.navigation.title)},
      icon: 'folder',
    })
  })
})
`
}

function filesFor(config, root) {
  const apiRoot = `apps/api/src/routes/${config.slug}`
  const webRoot = `apps/web/src/routes/(authenticated)/master-data/${config.slug}`
  const routeRoot = `${webRoot}/[${lowerCamel(config.symbol)}Id]`
  const routes = renderRoutes(config)
  const files = [
    [`${apiRoot}/${config.slug}.entity.ts`, renderEntity(config)],
    [`${apiRoot}/${config.slug}.ts`, renderRoute(config)],
    [`${apiRoot}/${config.slug}.routes.spec.ts`, renderRouteTest(config)],
    [`${webRoot}/${config.slug}.schema.ts`, renderSchema(config)],
    [`${webRoot}/${config.slug}.resource.ts`, renderResource(config)],
    [`${webRoot}/${config.slug}.resource.spec.ts`, renderResourceTest(config)],
    [`${webRoot}/index.route.vue`, routes.index],
    [`${webRoot}/create.route.vue`, routes.create],
    [`${webRoot}/${config.slug}.integration.spec.ts`, renderIntegrationTest(config)],
    [`${routeRoot}/detail.route.vue`, routes.detail],
    [`${routeRoot}/edit.route.vue`, routes.edit],
  ]
  const seed = renderSeed(config)
  if (seed) files.push([`${apiRoot}/${config.slug}.seed.ts`, seed])
  return files.map(([relativePath, contents]) => ({ path: resolve(root, relativePath), contents }))
}

export function expectedGeneratedPaths(value, { root = repoRoot } = {}) {
  const config = validateConfig(value)
  return filesFor(config, resolve(root)).map((file) => file.path).sort((left, right) => left.localeCompare(right))
}

export function scaffold(value, { root = repoRoot } = {}) {
  const config = validateConfig(value)
  const outputRoot = resolve(root)
  const files = filesFor(config, outputRoot)
  const metadata = moduleMetadata(config)
  const generated = files.map((file) => file.path).sort((left, right) => left.localeCompare(right))
  const integration = [
    'apps/api/src/authorization/catalog.ts',
    'apps/api/src/routes/index.ts',
    'apps/web/src/manifest/navigation.ts',
    'apps/web/src/routes/(authenticated)/master-data/index.route.vue',
    ...(config.seed ? ['apps/api/scripts/seed.ts'] : []),
  ].map((path) => resolve(outputRoot, path)).sort((left, right) => left.localeCompare(right))
  const manual = [resolve(outputRoot, 'apps/web/src/route-map.d.ts')]

  const existing = files.find((file) => existsSync(file.path))
  if (existing) throw new Error(`Refusing to overwrite existing generated file: ${existing.path}`)

  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true })
    writeFileSync(file.path, `${file.contents.trimStart()}\n`, { flag: 'wx' })
  }

  return {
    generated,
    integration,
    manual,
    routes: metadata.routes,
    permissions: metadata.permissions,
    checks: {
      apiTest: resolve(outputRoot, `apps/api/src/routes/${config.slug}/${config.slug}.routes.spec.ts`),
      webTests: [
        resolve(outputRoot, `apps/web/src/routes/(authenticated)/master-data/${config.slug}/${config.slug}.resource.spec.ts`),
        resolve(outputRoot, `apps/web/src/routes/(authenticated)/master-data/${config.slug}/${config.slug}.integration.spec.ts`),
      ],
      apiTypeCheck: 'pnpm --filter @southneuhof/api type-check',
      webTypeCheck: 'pnpm --filter @southneuhof/framework-web type-check',
    },
  }
}

function parseArgs(argv) {
  let configPath
  let outputRoot
  let json = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--json') {
      json = true
    } else if (argument === '--config') {
      configPath = argv[index + 1]
      index += 1
      if (!configPath || configPath.startsWith('--')) throw new Error('--config requires a JSON file path.')
    } else if (argument === '--root') {
      outputRoot = argv[index + 1]
      index += 1
      if (!outputRoot || outputRoot.startsWith('--')) throw new Error('--root requires an output directory.')
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (!configPath) throw new Error('Usage: node scripts/scaffold-master-data.mjs --config <file.json> [--root <directory>] [--json]')
  return { configPath, outputRoot, json }
}

function output(result, json) {
  if (json) return JSON.stringify(result, null, 2)
  return [
    'Generated files:',
    ...result.generated.map((path) => `- ${path}`),
    '',
    'Integration files:',
    ...result.integration.map((path) => `- ${path}`),
    '',
    'Manual files:',
    ...result.manual.map((path) => `- ${path}`),
    '',
    'Routes:',
    ...Object.entries(result.routes).map(([key, value]) => `- ${key}: ${value}`),
    '',
    'Permissions:',
    ...Object.entries(result.permissions).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n')
}

export function execute(argv, { root = repoRoot, cwd = process.cwd() } = {}) {
  const { configPath, outputRoot, json } = parseArgs(argv)
  const absoluteConfigPath = resolve(cwd, configPath)
  let config
  try {
    config = JSON.parse(readFileSync(absoluteConfigPath, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Cannot read scaffold config ${absoluteConfigPath}: ${message}`)
  }
  return output(scaffold(config, { root: outputRoot ? resolve(cwd, outputRoot) : root }), json)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(execute(process.argv.slice(2)))
  } catch (error) {
    console.error(`scaffold-master-data: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
