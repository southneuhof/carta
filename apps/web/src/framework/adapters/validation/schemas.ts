import { findSchema, type SchemaOperation } from '@southneuhof/contracts'
import { fromZod, type SchemaAdapter } from '@southneuhof/is-vue-framework'

/**
 * Project schema lookup.
 *
 * The API entity modules own the authoritative schemas but cannot be imported
 * into the browser (they pull in `node:crypto`, Drizzle, and `drizzle-zod`), so
 * the browser-safe manifest in `@southneuhof/contracts` is the source here.
 * `apps/api/src/__tests__/schema-parity.spec.ts` keeps the two in step.
 */
export const schemaAdapter: SchemaAdapter = {
  find: (resource, operation) => {
    const schema = findSchema(resource, operation as SchemaOperation)
    return schema ? fromZod(schema) : undefined
  },
}
