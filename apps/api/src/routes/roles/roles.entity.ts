import { randomUUID } from 'node:crypto'
import { createEntity } from '@southneuhof/sprindle/model'
import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(randomUUID),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })])

export const role = createEntity({
  table: roles,
  schemas: {
    create: createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(roles).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(roles),
  },
})
