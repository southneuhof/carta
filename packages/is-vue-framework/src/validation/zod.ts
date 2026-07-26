/**
 * Zod bridge.
 *
 * Zod schemas are the source of truth for validation; core components depend
 * only on the structural `ValidationSchema` contract, so a schema may arrive
 * from an RPC manifest, a resource definition, or a hand-written module without
 * changing a component.
 */
import type { ZodIssue, ZodTypeAny } from 'zod'
import type { ValidationIssue, ValidationResult, ValidationSchema } from '../contracts'
import type { FieldLayer } from '../fields'

export function normalizeZodIssues(issues: readonly ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({ path: [...issue.path], message: issue.message }))
}

export interface ZodValidationSchema<TOutput> extends ValidationSchema<TOutput> {
  /** Keys the schema requires; used for the hidden-but-required diagnostic. */
  requiredKeys: string[]
  source: ZodTypeAny
}

function objectShape(schema: ZodTypeAny): Record<string, ZodTypeAny> | undefined {
  const shape = (schema as unknown as { shape?: Record<string, ZodTypeAny> }).shape
  if (!shape || typeof shape !== 'object') return undefined
  return shape
}

export function requiredSchemaKeys(schema: ZodTypeAny): string[] {
  const shape = objectShape(schema)
  if (!shape) return []
  return Object.entries(shape)
    .filter(([, value]) => !(value as unknown as { isOptional: () => boolean }).isOptional())
    .map(([key]) => key)
}

export function fromZod<TOutput>(schema: ZodTypeAny): ZodValidationSchema<TOutput> {
  return {
    source: schema,
    requiredKeys: requiredSchemaKeys(schema),
    validate: (input: unknown): ValidationResult<TOutput> => {
      const result = schema.safeParse(input)
      if (result.success) return { success: true, data: result.data as TOutput }
      return { success: false, issues: normalizeZodIssues(result.error.issues) }
    },
  }
}

const rendererByTypeName: Record<string, string> = {
  ZodString: 'text',
  ZodNumber: 'number',
  ZodBoolean: 'switch',
  ZodDate: 'date',
  ZodEnum: 'select',
  ZodNativeEnum: 'select',
  ZodArray: 'tag',
}

function unwrap(schema: ZodTypeAny): ZodTypeAny {
  const definition = (schema as unknown as { _def?: { typeName?: string; innerType?: ZodTypeAny; schema?: ZodTypeAny } })._def
  const typeName = definition?.typeName
  if (typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault') {
    return unwrap(definition!.innerType as ZodTypeAny)
  }
  if (typeName === 'ZodEffects' && definition?.schema) return unwrap(definition.schema)
  return schema
}

/**
 * Renderer inference from schema metadata. Constraints such as required,
 * minimum length, or patterns stay in the schema and are never copied into
 * presentation config.
 */
export function inferFieldLayers(schema: ZodTypeAny): Record<string, FieldLayer> {
  const shape = objectShape(schema)
  if (!shape) return {}

  const layers: Record<string, FieldLayer> = {}
  for (const [key, value] of Object.entries(shape)) {
    const inner = unwrap(value)
    const typeName = (inner as unknown as { _def?: { typeName?: string } })._def?.typeName ?? ''
    const renderer = rendererByTypeName[typeName]
    if (!renderer) continue

    const layer: FieldLayer = { renderer }
    if (typeName === 'ZodEnum') {
      const options = (inner as unknown as { _def: { values: string[] } })._def.values
      layer.props = { options }
    }
    layers[key] = layer
  }
  return layers
}
