/**
 * Schema selection and draft validation.
 *
 * Precedence, highest first:
 *
 *   explicit component schema > resource operation schema > RPC-derived schema
 *   > manually composed catalog schema
 *
 * The resource prop factory that wired a create or update submit attaches the
 * matching operation schema (plan 006). Form never selects between create and
 * update schemas and has no mode.
 *
 * Behavior decides presence, schemas decide validity: validation always runs on
 * the visibility-filtered draft.
 */
import type { SchemaAdapter } from '../adapters/projectAdapters'
import type { ResourceOperation, ValidationResult, ValidationSchema } from '../contracts'
import { fromZod } from './zod'

export interface SchemaSelection {
  /** Passed directly to the component; always wins. */
  explicit?: ValidationSchema
  /** Declared on the resource for this operation. */
  resource?: ValidationSchema
  /** Looked up through the project schema adapter. */
  adapter?: { adapter?: SchemaAdapter; resourceKey: string; operation: Extract<ResourceOperation, 'create' | 'update'> | 'record' | 'query' }
  /** Composed by hand from the field catalog for offline resources. */
  manual?: ValidationSchema
}

export function selectSchema(selection: SchemaSelection): ValidationSchema | undefined {
  if (selection.explicit) return selection.explicit
  if (selection.resource) return selection.resource

  const lookup = selection.adapter
  if (lookup?.adapter) {
    const found = lookup.adapter.find(lookup.resourceKey, lookup.operation)
    if (found) return found
  }

  return selection.manual
}

export interface DraftValidationOptions<TDraft extends object> {
  schema?: ValidationSchema<TDraft>
  /** The visibility-filtered draft — hidden fields contribute no value. */
  draft: Partial<TDraft>
  /** Field keys currently hidden by behavior, used for the diagnostic below. */
  hiddenKeys?: readonly string[]
}

/**
 * A schema-required field that behavior hides can never be satisfied by the
 * user. That is a contradictory definition, so it throws for the developer
 * rather than surfacing an unresolvable error to the user.
 */
export function assertNoHiddenRequiredFields(schema: ValidationSchema | undefined, hiddenKeys: readonly string[]): void {
  if (!schema || hiddenKeys.length === 0) return
  const required = (schema as { requiredKeys?: string[] }).requiredKeys
  if (!required) return

  const conflicting = hiddenKeys.filter((key) => required.includes(key))
  if (conflicting.length === 0) return
  throw new Error(
    `[is-vue-framework] Field(s) ${conflicting.join(', ')} are required by the schema but hidden by behavior. Make requiredness conditional in the schema (refine or a discriminated union) instead.`,
  )
}

export function validateDraft<TDraft extends object>(
  options: DraftValidationOptions<TDraft>,
): ValidationResult<TDraft> {
  const { schema, draft } = options
  assertNoHiddenRequiredFields(schema, options.hiddenKeys ?? [])
  if (!schema) return { success: true, data: draft as TDraft }
  return schema.validate(draft)
}

export { fromZod }
