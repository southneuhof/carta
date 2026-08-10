import { createEntity } from '@southneuhof/sprindle/entity'
import { sql } from 'drizzle-orm'
import { boolean, decimal, index, integer, pgTable, text, timestamp, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const businessCategories = pgTable('business_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const divisions = pgTable(
  'divisions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessCategoryId: text('business_category_id')
      .notNull()
      .references(() => businessCategories.id),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    imgThumbnail: text('img_thumbnail'),
    statusCode: text('status_code').notNull().default('active'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('divisions_business_category_idx').on(table.businessCategoryId)]
)

export const projects = pgTable(
  'projects',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    divisionId: text('division_id')
      .notNull()
      .references(() => divisions.id),
    number: text('number').notNull().unique(),
    integrationCode: text('integration_code').notNull().unique(),
    name: text('name').notNull(),
    currentProgress: decimal('current_progress', { precision: 12, scale: 2 }).notNull().default('0'),
    location: text('location'),
    startDate: text('start_date'),
    endDate: text('end_date'),
    imgThumbnail: text('img_thumbnail'),
    description: text('description'),
    isJo: boolean('is_jo').notNull().default(false),
    statusCode: text('status_code').notNull().default('active'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('projects_division_idx').on(table.divisionId)]
)

export const uoms = pgTable('uoms', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const workItems = pgTable(
  'work_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    parentId: text('parent_id').references((): AnyPgColumn => workItems.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isHighRisk: boolean('is_high_risk').notNull().default(false),
    level: integer('level').notNull().default(0),
    volume: decimal('volume', { precision: 12, scale: 2 }),
    uomId: text('uom_id').references(() => uoms.id),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('work_items_project_idx').on(table.projectId), index('work_items_parent_idx').on(table.parentId)]
)

export const projectVendors = pgTable(
  'project_vendors',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    name: text('name').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('project_vendors_project_idx').on(table.projectId)]
)

export const ptsWorkCategories = pgTable('pts_work_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const rootCauses = pgTable('root_causes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const numberVariables = pgTable('number_variables', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const numberConfigs = pgTable(
  'number_configs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    numberVariableCode: text('number_variable_code')
      .notNull()
      .references(() => numberVariables.code),
    numberOfDigits: integer('number_of_digits').notNull().default(0),
    customCode: text('custom_code'),
    displayOrder: integer('display_order').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    index('number_configs_variable_idx').on(table.numberVariableCode),
    uniqueIndex('number_configs_active_order_idx')
      .on(table.displayOrder)
      .where(sql`active = true`),
  ]
)

const write = {
  id: true,
  createdByUserId: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const

export const businessCategory = createEntity({
  table: businessCategories,
  schemas: {
    create: createInsertSchema(businessCategories).omit(write),
    update: createUpdateSchema(businessCategories).omit(write),
    select: createSelectSchema(businessCategories),
  },
})
export const division = createEntity({
  table: divisions,
  schemas: {
    create: createInsertSchema(divisions).omit(write),
    update: createUpdateSchema(divisions).omit(write),
    select: createSelectSchema(divisions),
  },
})
export const project = createEntity({
  table: projects,
  schemas: {
    create: createInsertSchema(projects).omit(write),
    update: createUpdateSchema(projects).omit(write),
    select: createSelectSchema(projects),
  },
})
export const uom = createEntity({
  table: uoms,
  schemas: {
    create: createInsertSchema(uoms).omit(write),
    update: createUpdateSchema(uoms).omit(write),
    select: createSelectSchema(uoms),
  },
})
export const workItem = createEntity({
  table: workItems,
  schemas: {
    create: createInsertSchema(workItems).omit(write),
    update: createUpdateSchema(workItems).omit(write),
    select: createSelectSchema(workItems),
  },
})
export const projectVendor = createEntity({
  table: projectVendors,
  schemas: {
    create: createInsertSchema(projectVendors).omit(write),
    update: createUpdateSchema(projectVendors).omit(write),
    select: createSelectSchema(projectVendors),
  },
})
export const ptsWorkCategory = createEntity({
  table: ptsWorkCategories,
  schemas: {
    create: createInsertSchema(ptsWorkCategories).omit(write),
    update: createUpdateSchema(ptsWorkCategories).omit(write),
    select: createSelectSchema(ptsWorkCategories),
  },
})
export const rootCause = createEntity({
  table: rootCauses,
  schemas: {
    create: createInsertSchema(rootCauses).omit(write),
    update: createUpdateSchema(rootCauses).omit(write),
    select: createSelectSchema(rootCauses),
  },
})
export const numberVariable = createEntity({
  table: numberVariables,
  schemas: {
    create: createInsertSchema(numberVariables).omit(write),
    update: createUpdateSchema(numberVariables).omit(write),
    select: createSelectSchema(numberVariables),
  },
})
export const numberConfig = createEntity({
  table: numberConfigs,
  schemas: {
    create: createInsertSchema(numberConfigs).omit(write),
    update: createUpdateSchema(numberConfigs).omit(write),
    select: createSelectSchema(numberConfigs),
  },
})
