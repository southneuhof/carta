import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const toolsTypeCategoryCodes = ['heavy-equipments', 'measuring-instruments'] as const

export const toolsTypes = pgTable('tools_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryCode: text('category_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  ...auditFields,
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const toolsType = createEntity({
  table: toolsTypes,
  schemas: {
    create: createInsertSchema(toolsTypes).omit(write).extend({
      categoryCode: z.string().trim().min(1).max(255),
      name: z.string().trim().min(1).max(255),
      description: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().default(true),
    }),
    update: createUpdateSchema(toolsTypes).omit(write).extend({
      categoryCode: z.string().trim().min(1).max(255).optional(),
      name: z.string().trim().min(1).max(255).optional(),
      description: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(toolsTypes),
  },
})
