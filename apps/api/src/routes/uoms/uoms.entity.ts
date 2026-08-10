import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const uoms = pgTable('uoms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  uomType: text('uom_type').notNull().default('work-items'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

const write = { id: true, uomType: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const uom = createEntity({
  table: uoms,
  schemas: {
    create: createInsertSchema(uoms).omit(write),
    update: createUpdateSchema(uoms).omit(write),
    select: createSelectSchema(uoms),
  },
})
