import { findSchema, type SchemaOperation } from '@southneuhof/contracts'
import { fromZod, type SchemaAdapter } from '@southneuhof/is-vue-framework'

/**
 * Project schema lookup.
 *
 * The API entity modules own the authoritative schemas and, as of plan 021, can
 * be imported into the browser directly — `roles` does exactly that in
 * `adapters/resources/roles.ts`. This adapter still reads the manifest in
 * `@southneuhof/contracts` because it answers lookups for every resource, and
 * the resources beyond `roles` have not been migrated; the manifest is their
 * source and `apps/api/src/__tests__/schema-parity.spec.ts` keeps them in step.
 */
export const schemaAdapter: SchemaAdapter = {
  find: (resource, operation) => {
    const schema = findSchema(resource, operation as SchemaOperation)
    return schema ? fromZod(schema) : undefined
  },
}
