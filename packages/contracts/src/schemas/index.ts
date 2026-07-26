/**
 * Browser-safe schema manifest.
 *
 * The API entity modules own the authoritative Zod schemas. As of plan 021 they
 * *are* importable from a browser bundle — `node:crypto` is gone and they take
 * Sprindle's `./entity` subpath rather than the Hono-carrying `./model` — and
 * `roles` already validates against `role.schemas` directly. What kept this
 * manifest is cost, not capability: the first entity import pulls
 * `drizzle-orm/pg-core` and `drizzle-zod` into the bundle for about 54 kB
 * gzipped, paid once. See the Measurement section of
 * `plans/021-browser-safe-entity-schemas.md`.
 *
 * So this manifest remains for the resources not yet migrated, and
 * `apps/api/src/__tests__/schema-parity.spec.ts` remains their drift gate.
 * Prefer importing the entity schemas for anything new.
 *
 * Nothing in this folder may import a database, server, auth, or Node module.
 */
import { z } from 'zod'

export type SchemaOperation = 'record' | 'query' | 'create' | 'update'

const collectionQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
})

export const roleSchemas = {
  record: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  query: collectionQuery,
  create: z.object({ name: z.string() }),
  update: z.object({ name: z.string().optional() }),
}

export const userSchemas = {
  record: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    roleId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    role: roleSchemas.record.optional(),
  }),
  query: collectionQuery,
  create: z.object({
    name: z.string(),
    email: z.string(),
    roleId: z.string(),
  }),
  update: z.object({
    name: z.string().optional(),
    roleId: z.string().optional(),
  }),
}

export const schemaManifest = {
  roles: roleSchemas,
  users: userSchemas,
} satisfies Record<string, Partial<Record<SchemaOperation, z.ZodTypeAny>>>

export type SchemaManifest = typeof schemaManifest

/** Returns undefined for resources or operations without declared metadata. */
export function findSchema(resource: string, operation: SchemaOperation): z.ZodTypeAny | undefined {
  const resourceSchemas = (schemaManifest as Record<string, Partial<Record<SchemaOperation, z.ZodTypeAny>>>)[resource]
  return resourceSchemas?.[operation]
}
