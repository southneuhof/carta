import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
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

export const tollCausesAccidentsCategories = pgTable('toll_causes_accidents_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const tollCausesAccidents = pgTable('toll_causes_accidents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryCode: text('category_code').notNull().references(() => tollCausesAccidentsCategories.code),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const tollCausesAccidentsCategory = createEntity({
  table: tollCausesAccidentsCategories,
  schemas: {
    create: createInsertSchema(tollCausesAccidentsCategories).omit(write),
    update: createUpdateSchema(tollCausesAccidentsCategories).omit(write),
    select: createSelectSchema(tollCausesAccidentsCategories),
  },
})

export const tollCausesAccidentsCause = createEntity({
  table: tollCausesAccidents,
  schemas: {
    create: createInsertSchema(tollCausesAccidents).omit(write).extend({
      categoryCode: z.string().trim().min(1).max(255),
      name: z.string().trim().min(1).max(255),
      code: z.string().trim().max(255).nullable().optional(),
      description: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().default(true),
    }),
    update: createUpdateSchema(tollCausesAccidents).omit(write).extend({
      categoryCode: z.string().trim().min(1).max(255).optional(),
      name: z.string().trim().min(1).max(255).optional(),
      code: z.string().trim().max(255).nullable().optional(),
      description: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(tollCausesAccidents).extend({
      category: tollCausesAccidentsCategory.schemas.select.nullable().optional(),
    }),
  },
})

export const tollCausesAccidentsRelations = defineRelationsPart({ tollCausesAccidentsCategories, tollCausesAccidents }, (r) => ({
  tollCausesAccidents: {
    category: r.one.tollCausesAccidentsCategories({ from: r.tollCausesAccidents.categoryCode, to: r.tollCausesAccidentsCategories.code }),
  },
}))
