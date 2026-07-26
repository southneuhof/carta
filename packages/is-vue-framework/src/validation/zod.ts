/**
 * Zod bridge.
 *
 * Zod schemas are the source of truth for validation; core components depend
 * only on the structural `ValidationSchema` contract, so a schema may arrive
 * from an RPC manifest, a resource definition, or a hand-written module without
 * changing a component.
 *
 * Two Zod dialects reach this bridge. Classic `zod` backs the browser-safe
 * schema manifest; the `zod/v4` subpath backs the API entity modules, whose
 * `drizzle-zod` schemas the browser imports directly. They emit unrelated
 * types, so every signature here is structural rather than nominal, and the
 * metadata readers normalize the internal shape each dialect records.
 */
import type { ValidationIssue, ValidationResult, ValidationSchema } from '../contracts'
import type { FieldLayer } from '../fields'

/**
 * The part of a Zod issue this bridge reads. Classic Zod types the path as
 * `(string | number)[]` and the v4 dialect widens it to `PropertyKey[]`, so the
 * wider one is the common shape.
 */
export type ZodIssueLike = { path: readonly PropertyKey[]; message: string }

/**
 * Structural stand-in for a Zod schema of either dialect. The bridge only ever
 * reads `safeParse`, `shape`, `isOptional` and `_def`, so this is the honest
 * contract — a nominal `ZodTypeAny` would name one dialect and reject the other.
 * `_def` stays `unknown` because each dialect's own definition type is a closed
 * interface with no index signature; every read below narrows it explicitly.
 */
export type ZodSchemaLike = {
  safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: { issues: readonly ZodIssueLike[] } }
  isOptional?: () => boolean
  shape?: Record<string, unknown>
  _def?: unknown
}

export function normalizeZodIssues(issues: readonly ZodIssueLike[]): ValidationIssue[] {
  // Object and array paths are always string or number segments in practice;
  // only the v4 path type admits symbols, and no schema kind produces one.
  return issues.map((issue) => ({ path: [...issue.path] as (string | number)[], message: issue.message }))
}

export interface ZodValidationSchema<TOutput> extends ValidationSchema<TOutput> {
  /** Keys the schema requires; used for the hidden-but-required diagnostic. */
  requiredKeys: string[]
  source: ZodSchemaLike
}

function objectShape(schema: ZodSchemaLike): Record<string, ZodSchemaLike> | undefined {
  const shape = schema.shape
  if (!shape || typeof shape !== 'object') return undefined
  return shape as Record<string, ZodSchemaLike>
}

export function requiredSchemaKeys(schema: ZodSchemaLike): string[] {
  const shape = objectShape(schema)
  if (!shape) return []
  return Object.entries(shape)
    .filter(([, value]) => !value.isOptional?.())
    .map(([key]) => key)
}

export function fromZod<TOutput>(schema: ZodSchemaLike): ZodValidationSchema<TOutput> {
  return {
    source: schema,
    requiredKeys: requiredSchemaKeys(schema),
    validate: (input: unknown): ValidationResult<TOutput> => {
      const result = schema.safeParse(input)
      if (result.success) return { success: true, data: result.data as TOutput }
      return { success: false, issues: normalizeZodIssues(result.error?.issues ?? []) }
    },
  }
}

/**
 * One tag per schema kind, whichever dialect produced it. Classic Zod records
 * `_def.typeName` (`'ZodString'`); the v4 dialect records `_def.type`
 * (`'string'`) and drops `typeName` entirely.
 */
function typeTag(schema: ZodSchemaLike): string {
  const definition = schema._def as { type?: string; typeName?: string } | undefined
  if (!definition) return ''
  if (definition.type) return definition.type
  const legacy = definition.typeName
  return legacy ? legacy.replace(/^Zod/, '').toLowerCase() : ''
}

const rendererByTypeTag: Record<string, string> = {
  string: 'text',
  number: 'number',
  boolean: 'switch',
  date: 'date',
  enum: 'select',
  nativeenum: 'select',
  array: 'tag',
}

type WrapperDefinition = { innerType?: ZodSchemaLike; schema?: ZodSchemaLike; in?: ZodSchemaLike }

function unwrap(schema: ZodSchemaLike): ZodSchemaLike {
  const definition = schema._def as WrapperDefinition | undefined
  if (!definition) return schema

  const tag = typeTag(schema)
  if (tag === 'optional' || tag === 'nullable' || tag === 'default') {
    return definition.innerType ? unwrap(definition.innerType) : schema
  }
  // Classic wraps transforms and refinements in `ZodEffects`; v4 pipes them.
  if (tag === 'effects' && definition.schema) return unwrap(definition.schema)
  if (tag === 'pipe' && definition.in) return unwrap(definition.in)
  return schema
}

/** Enum members are an array in classic Zod and an object map in the v4 dialect. */
function enumOptions(schema: ZodSchemaLike): string[] | undefined {
  const definition = schema._def as { values?: string[]; entries?: Record<string, string> } | undefined
  if (definition?.values) return definition.values
  if (definition?.entries) return Object.values(definition.entries)
  return undefined
}

/**
 * Renderer inference from schema metadata. Constraints such as required,
 * minimum length, or patterns stay in the schema and are never copied into
 * presentation config.
 */
export function inferFieldLayers(schema: ZodSchemaLike): Record<string, FieldLayer> {
  const shape = objectShape(schema)
  if (!shape) return {}

  const layers: Record<string, FieldLayer> = {}
  for (const [key, value] of Object.entries(shape)) {
    const inner = unwrap(value)
    const tag = typeTag(inner)
    const renderer = rendererByTypeTag[tag]
    if (!renderer) continue

    const layer: FieldLayer = { renderer }
    if (tag === 'enum' || tag === 'nativeenum') {
      const options = enumOptions(inner)
      if (options) layer.props = { options }
    }
    layers[key] = layer
  }
  return layers
}
