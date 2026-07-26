import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { users } from '../users/users.entity'

/**
 * How wide a role sees, widest first. A user holding several roles gets the
 * widest scope among them, so index order here is the comparison order.
 */
export const roleScopes = ['all', 'central', 'section', 'owner'] as const
export type RoleScope = (typeof roleScopes)[number]

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  scope: text('scope').notNull().default('section').$type<RoleScope>(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
})

// Mappings are deactivated, never deleted — the reference system keeps the row so
// a revoked grant stays visible in history.
export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(true),
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })])

export const userRoles = pgTable('user_roles', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(true),
}, (table) => [primaryKey({ columns: [table.userId, table.roleId] })])

// `scope` is a text column so the enum stays a single source of truth in TypeScript
// rather than a Postgres type that migrations have to alter. The schemas narrow it.
//
// A drizzle-zod refinement replaces the generated column schema outright rather than
// wrapping it, so the optionality the column default would have produced has to be
// restated here — on the write schemas only, never on select.
const writeScope = { scope: z.enum(roleScopes).optional() }

export const role = createEntity({
  table: roles,
  schemas: {
    create: createInsertSchema(roles, writeScope).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(roles, writeScope).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(roles, { scope: z.enum(roleScopes) }),
  },
})
