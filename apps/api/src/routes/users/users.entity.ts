import { createEntity } from '@southneuhof/sprindle/model'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const user = createEntity({
  table: users,
  schemas: {
    create: createInsertSchema(users),
    update: createUpdateSchema(users).omit({ id: true }),
    select: createSelectSchema(users),
  },
})
