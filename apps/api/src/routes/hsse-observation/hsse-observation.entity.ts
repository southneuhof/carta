import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, integer, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const findingCriteria = pgTable('finding_criteria', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const findingTypes = pgTable('finding_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  findingCriteriaCode: text('finding_criteria_code').notNull().references(() => findingCriteria.code),
  name: text('name').notNull(),
  code: text('code').unique(),
  displayOrder: integer('display_order').notNull().default(0),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [index('finding_types_criteria_idx').on(table.findingCriteriaCode)])

export const findingCategories = pgTable('finding_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  findingTypeId: text('finding_type_id').notNull().references(() => findingTypes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  displayOrder: integer('display_order').notNull().default(0),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [index('finding_categories_type_idx').on(table.findingTypeId)])

export const findingCauses = pgTable('finding_cause', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  findingCategoryId: text('finding_category_id').notNull().references(() => findingCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [index('finding_cause_category_idx').on(table.findingCategoryId)])

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

const commonCreate = {
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(255).nullable().optional(),
  active: z.boolean().default(true),
}

const commonUpdate = {
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  active: z.boolean().optional(),
}

export const findingCriteriaEntity = createEntity({
  table: findingCriteria,
  schemas: {
    create: createInsertSchema(findingCriteria).omit(write).extend({ ...commonCreate, code: z.string().trim().max(255).nullable().optional() }),
    update: createUpdateSchema(findingCriteria).omit(write).extend({ ...commonUpdate, code: z.string().trim().max(255).nullable().optional() }),
    select: createSelectSchema(findingCriteria),
  },
})

export const findingTypeEntity = createEntity({
  table: findingTypes,
  schemas: {
    create: createInsertSchema(findingTypes).omit(write).extend({
      findingCriteriaCode: z.string().trim().min(1),
      ...commonCreate,
      code: z.string().trim().max(255).nullable().optional(),
      displayOrder: z.number().int().default(0),
    }),
    update: createUpdateSchema(findingTypes).omit({ ...write, findingCriteriaCode: true }).extend({
      ...commonUpdate,
      code: z.string().trim().max(255).nullable().optional(),
      displayOrder: z.number().int().optional(),
    }),
    select: createSelectSchema(findingTypes).extend({ findingCriteria: findingCriteriaEntity.schemas.select.nullable().optional() }),
  },
})

export const findingCategoryEntity = createEntity({
  table: findingCategories,
  schemas: {
    create: createInsertSchema(findingCategories).omit(write).extend({
      findingTypeId: z.string().trim().min(1),
      ...commonCreate,
      code: z.string().trim().min(1).max(255),
      displayOrder: z.number().int().default(0),
    }),
    update: createUpdateSchema(findingCategories).omit({ ...write, findingTypeId: true }).extend({
      ...commonUpdate,
      code: z.string().trim().min(1).max(255).optional(),
      displayOrder: z.number().int().optional(),
    }),
    select: createSelectSchema(findingCategories).extend({ findingType: findingTypeEntity.schemas.select.nullable().optional() }),
  },
})

export const findingCauseEntity = createEntity({
  table: findingCauses,
  schemas: {
    create: createInsertSchema(findingCauses).omit(write).extend({
      findingCategoryId: z.string().trim().min(1),
      ...commonCreate,
      code: z.string().trim().min(1).max(255),
    }),
    update: createUpdateSchema(findingCauses).omit({ ...write, findingCategoryId: true }).extend({
      ...commonUpdate,
      code: z.string().trim().min(1).max(255).optional(),
    }),
    select: createSelectSchema(findingCauses).extend({ findingCategory: findingCategoryEntity.schemas.select.nullable().optional() }),
  },
})

export const hsseObservationRelations = defineRelationsPart({ findingCriteria, findingTypes, findingCategories, findingCauses }, (r) => ({
  findingTypes: {
    findingCriteria: r.one.findingCriteria({ from: r.findingTypes.findingCriteriaCode, to: r.findingCriteria.code }),
  },
  findingCategories: {
    findingType: r.one.findingTypes({ from: r.findingCategories.findingTypeId, to: r.findingTypes.id }),
  },
  findingCauses: {
    findingCategory: r.one.findingCategories({ from: r.findingCauses.findingCategoryId, to: r.findingCategories.id }),
  },
}))
