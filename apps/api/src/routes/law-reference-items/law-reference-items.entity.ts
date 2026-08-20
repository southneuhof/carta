import { createEntity, type DomainEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const lawReferenceCategories = pgTable('law_reference_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const lawReferenceItems = pgTable(
  'law_reference_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    lawReferenceCategoryCode: text('law_reference_category_code').notNull().references(() => lawReferenceCategories.code),
    name: text('name').notNull(),
    level: integer('level').notNull(),
    type: text('type'),
    parentId: text('parent_id').references((): AnyPgColumn => lawReferenceItems.id),
    active: boolean('active').notNull().default(true),
    deleted: boolean('deleted').notNull().default(false),
    deletedByUserId: text('deleted_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    deletedReason: text('deleted_reason'),
    ...auditFields,
  },
  (table) => [
    index('law_reference_items_category_idx').on(table.lawReferenceCategoryCode),
    index('law_reference_items_parent_idx').on(table.parentId),
    index('law_reference_items_deleted_idx').on(table.deleted),
  ],
)

const typeSchema = z.enum(['reference', 'applicable'])
export const lawReferenceCategorySelectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  createdByUserId: z.string().nullable(),
  updatedByUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const lawReferenceCategory = createEntity({
  table: lawReferenceCategories,
  schemas: {
    create: z.object({ name: z.string(), code: z.string(), description: z.string().nullable().optional(), active: z.boolean().default(true) }),
    update: z.object({ name: z.string().optional(), code: z.string().optional(), description: z.string().nullable().optional(), active: z.boolean().optional() }),
    select: lawReferenceCategorySelectSchema,
  },
})

const itemBaseSelectSchema = z.object({
  id: z.string(),
  lawReferenceCategoryCode: z.string(),
  name: z.string(),
  level: z.number().int(),
  type: z.string().nullable(),
  parentId: z.string().nullable(),
  active: z.boolean(),
  deleted: z.boolean(),
  deletedByUserId: z.string().nullable(),
  deletedAt: z.string().nullable(),
  deletedReason: z.string().nullable(),
  createdByUserId: z.string().nullable(),
  updatedByUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
type LawReferenceItemBase = z.infer<typeof itemBaseSelectSchema>
type LawReferenceItemSelect = LawReferenceItemBase & {
  category?: z.infer<typeof lawReferenceCategory.schemas.select> | null
  parent?: LawReferenceItemBase | null
}
const itemSelectSchema: z.ZodType<LawReferenceItemSelect> = itemBaseSelectSchema.extend({
  category: lawReferenceCategory.schemas.select.nullable().optional(),
  parent: z.lazy(() => itemSelectSchema).nullable().optional(),
}) as z.ZodType<LawReferenceItemSelect>
export const lawReferenceItemSelectSchema = itemSelectSchema

export const lawReferenceItemFlatSelectSchema = itemBaseSelectSchema.extend({
  category: lawReferenceCategory.schemas.select.nullable().optional(),
  parent: itemBaseSelectSchema.nullable().optional(),
})

export const lawReferenceItemCreateSchema = z.object({
  lawReferenceCategoryCode: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
  type: typeSchema.nullable().optional(),
  parentId: z.string().nullable().optional(),
  active: z.boolean().default(true),
}).strict()

export const lawReferenceItemUpdateSchema = z.object({
  lawReferenceCategoryCode: z.string().trim().min(1).max(255).optional(),
  name: z.string().trim().min(1).max(255).optional(),
  type: typeSchema.nullable().optional(),
  parentId: z.string().nullable().optional(),
  active: z.boolean().optional(),
}).strict()

export type LawReferenceItemRecord = z.infer<typeof itemSelectSchema>

const lawReferenceItemEntity = createEntity({
  table: lawReferenceItems,
  schemas: {
    create: lawReferenceItemCreateSchema,
    update: lawReferenceItemUpdateSchema,
    select: itemSelectSchema,
  },
})

export const lawReferenceItem = lawReferenceItemEntity as DomainEntity

export const lawReferenceItemsRelations = defineRelationsPart({ lawReferenceCategories, lawReferenceItems }, (r) => ({
  lawReferenceItems: {
    category: r.one.lawReferenceCategories({ from: r.lawReferenceItems.lawReferenceCategoryCode, to: r.lawReferenceCategories.code }),
    parent: r.one.lawReferenceItems({ from: r.lawReferenceItems.parentId, to: r.lawReferenceItems.id }),
  },
}))
