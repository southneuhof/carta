import { z } from 'zod/v4'
import { defineRoute } from '../routes'
import { isModelRoute } from '../model/route-types'
import type { ModelRoute, ModelRouteKind } from '../model/route-types'
import type { DefinedModel } from '../model'
import type { SprindleInstallable } from '../hono'

export type OpenApiInfo = { title: string; version: string }
export type OpenApiDocument = {
  openapi: '3.1.0'
  info: OpenApiInfo
  paths: Record<string, Record<string, unknown>>
  components: { schemas: Record<string, unknown> }
}

type EntitySchemas = { create?: unknown; update?: unknown; select?: unknown }

const RESERVED_LIST_QUERY_PARAMETERS = [
  { name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'search', schema: { type: 'string' } },
  { name: 'sort', schema: { type: 'string' } },
  { name: 'order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
]

const ERROR_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    issues: {
      type: 'array',
      items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } }, required: ['message'] },
    },
  },
  required: ['error'],
}

const ERROR_STATUSES: Record<string, string[]> = {
  list: ['400', '401', '403', '500'],
  detail: ['400', '401', '403', '404', '500'],
  create: ['400', '401', '403', '409', '422', '500'],
  update: ['400', '401', '403', '404', '409', '422', '500'],
  delete: ['400', '401', '403', '404', '500'],
  custom: ['400', '401', '403', '500'],
}

/** Builds an OpenAPI 3.1 document from the same models `installSprindle` mounts. */
export function generateOpenApi(installables: readonly SprindleInstallable[], info: OpenApiInfo): OpenApiDocument {
  const document: OpenApiDocument = { openapi: '3.1.0', info, paths: {}, components: { schemas: {} } }

  for (const installable of installables) {
    if (isModelRoute(installable)) {
      addOperation(document, installable.path, installable, undefined)
      continue
    }

    const model = installable as DefinedModel
    const entity = model.context?.entity as ({ name?: string } & { schemas?: EntitySchemas }) | undefined
    const entityName = componentName(model.name || model.path)
    registerEntitySchemas(document, entityName, entity?.schemas)
    walkRouteTree(document, model.routes as Record<string, unknown>, [], model.path, entityName)
  }

  return document
}

/** A `GET` route serving the generated document; mount it like any other top-level route. */
export function openapiRoute(installables: readonly SprindleInstallable[], info: OpenApiInfo, path = '/openapi.json') {
  return defineRoute({
    path,
    method: 'get',
    // Public by default; attach `authenticated()` in the app if the document is not public.
    action: ({ c }) => c.json(generateOpenApi(installables, info)),
  })
}

function walkRouteTree(
  document: OpenApiDocument,
  tree: Record<string, unknown>,
  segments: string[],
  prefix: string,
  entityName: string,
) {
  for (const [key, value] of Object.entries(tree)) {
    if (isModelRoute(value)) {
      // Mirrors compileRouteTree: nested keys become segments, then the route's own path.
      addOperation(document, `${joinPath(prefix, `/${[...segments, key].join('/')}`)}${value.path}`, value, entityName)
      continue
    }
    if (isPlainObject(value)) walkRouteTree(document, value, [...segments, key], prefix, entityName)
  }
}

function addOperation(document: OpenApiDocument, rawPath: string, route: ModelRoute, entityName: string | undefined) {
  const path = normalizePath(rawPath)
  const kind = route.kind as ModelRouteKind
  const operation: Record<string, unknown> = {
    responses: {
      ...successResponse(kind, entityName),
      ...Object.fromEntries((ERROR_STATUSES[kind] ?? ERROR_STATUSES.custom).map((status) => [status, jsonResponse('Error', ERROR_SCHEMA)])),
    },
  }

  const parameters = [
    ...pathParameters(path),
    ...(kind === 'list' ? RESERVED_LIST_QUERY_PARAMETERS.map((parameter) => ({ ...parameter, in: 'query', required: false })) : []),
  ]
  if (parameters.length) operation.parameters = parameters
  if (kind === 'list') operation.description = 'Any query parameter beyond the reserved ones filters on an equal column value.'
  if (kind === 'custom') operation.description = 'Response shape not declared.'

  if (entityName && (kind === 'create' || kind === 'update')) {
    const schemaName = `${entityName}${kind === 'create' ? 'Create' : 'Update'}`
    if (document.components.schemas[schemaName]) {
      operation.requestBody = { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } }
    }
  }

  document.paths[path] ??= {}
  document.paths[path][route.method] = operation
}

function successResponse(kind: ModelRouteKind, entityName: string | undefined) {
  const selectRef = entityName ? { $ref: `#/components/schemas/${entityName}` } : {}

  if (kind === 'list') {
    return {
      '200': jsonResponse('List', {
        type: 'object',
        properties: { data: { type: 'array', items: selectRef }, page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' } },
        required: ['data', 'page', 'limit', 'total'],
      }),
    }
  }
  if (kind === 'detail' || kind === 'update') return { '200': jsonResponse('Record', { type: 'object', properties: { data: selectRef }, required: ['data'] }) }
  if (kind === 'create') return { '201': jsonResponse('Created', { type: 'object', properties: { data: selectRef }, required: ['data'] }) }
  if (kind === 'delete') return { '200': jsonResponse('Deleted', { type: 'object', properties: { ok: { const: true } }, required: ['ok'] }) }
  return { '200': jsonResponse('Response shape not declared.', {}) }
}

function jsonResponse(description: string, schema: object) {
  return { description, content: { 'application/json': { schema } } }
}

function registerEntitySchemas(document: OpenApiDocument, entityName: string, schemas: EntitySchemas | undefined) {
  if (!schemas) return
  const named: [string, unknown][] = [
    [entityName, schemas.select],
    [`${entityName}Create`, schemas.create],
    [`${entityName}Update`, schemas.update],
  ]
  for (const [name, schema] of named) {
    if (!isZodSchema(schema)) continue
    document.components.schemas[name] = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })
  }
}

function isZodSchema(value: unknown): value is z.ZodType {
  return Boolean(value && typeof value === 'object' && '_zod' in (value as Record<string, unknown>))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

function componentName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]+(.)/g, (_match, character: string) => character.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function joinPath(prefix: string, path: string) {
  if (!prefix || prefix === '/') return path
  return `${prefix}${path}`
}

function normalizePath(path: string) {
  return path.replace(/\/{2,}/g, '/').replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

function pathParameters(path: string) {
  return [...path.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => ({ name: match[1], in: 'path', required: true, schema: { type: 'string' } }))
}
