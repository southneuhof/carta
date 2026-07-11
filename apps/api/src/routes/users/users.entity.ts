import { randomUUID } from 'node:crypto'
import { createEntity } from '@southneuhof/sprindle/model'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { role, roles } from '../roles/roles.entity'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(randomUUID),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  roleId: text('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

export const user = createEntity({
  table: users,
  schemas: {
    create: createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(users).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(users).extend({ role: role.schemas.select.optional() }),
  },
})
