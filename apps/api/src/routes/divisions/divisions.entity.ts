import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { businessCategories, businessCategory } from '../business-categories/business-categories.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const divisions = pgTable(
  'divisions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessCategoryId: text('business_category_id').notNull().references(() => businessCategories.id),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    imgThumbnail: text('img_thumbnail'),
    statusCode: text('status_code').notNull().default('active'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('divisions_business_category_idx').on(table.businessCategoryId)],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const division = createEntity({
  table: divisions,
  schemas: {
    create: createInsertSchema(divisions).omit(write),
    update: createUpdateSchema(divisions).omit(write),
    select: createSelectSchema(divisions).extend({ businessCategory: businessCategory.schemas.select.nullable().optional() }),
  },
})

export const divisionRelations = defineRelationsPart({ businessCategories, divisions }, (r) => ({
  divisions: { businessCategory: r.one.businessCategories({ from: r.divisions.businessCategoryId, to: r.businessCategories.id }) },
}))
