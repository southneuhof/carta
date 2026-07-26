/**
 * Browser-safe schema manifest.
 *
 * The API entity modules own the authoritative Zod schemas, but they are not
 * importable from a browser bundle: `users.entity.ts` and `roles.entity.ts`
 * pull in `node:crypto`, `drizzle-orm/pg-core`, and `drizzle-zod`. This package
 * therefore declares the same operation schemas with plain Zod, and
 * `apps/api/src/__tests__/schema-parity.spec.ts` proves the two stay equivalent
 * — that parity test is the drift gate.
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
