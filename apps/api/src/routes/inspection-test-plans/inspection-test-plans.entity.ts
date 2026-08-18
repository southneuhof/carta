import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { users } from '../users/users.entity'
import { workItems } from '../work-items/work-items.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const itpInspectorTypes = pgTable('itp_inspector_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const itpInspectionPoints = pgTable('itp_inspection_points', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const inspectionTestPlans = pgTable(
  'inspection_test_plans',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workItemId: text('work_item_id').notNull().references(() => workItems.id),
    type: text('type').notNull(),
    criteria: text('criteria'),
    procedureCode: text('procedure_code'),
    specification: text('specification'),
    method: text('method'),
    frequency: integer('frequency').notNull(),
    imgDocumentation: text('img_documentation'),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    index('inspection_test_plans_work_item_idx').on(table.workItemId),
    uniqueIndex('inspection_test_plans_active_work_item_type_idx').on(table.workItemId, table.type).where(sql`${table.active} = true`),
  ],
)

export const inspectionTestPlanInspectorTypes = pgTable(
  'inspection_test_plan_inspector_types',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    inspectionTestPlanId: text('inspection_test_plan_id').notNull().references(() => inspectionTestPlans.id, { onDelete: 'cascade' }),
    inspectorTypeId: text('inspector_type_id').notNull().references(() => itpInspectorTypes.id),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [uniqueIndex('inspection_test_plan_inspector_types_plan_type_idx').on(table.inspectionTestPlanId, table.inspectorTypeId)],
)

export const inspectionTestPlanInspectorPoints = pgTable(
  'inspection_test_plan_inspector_points',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    inspectionTestPlanInspectorTypeId: text('inspection_test_plan_inspector_type_id').notNull().references(() => inspectionTestPlanInspectorTypes.id, { onDelete: 'cascade' }),
    inspectionPointCode: text('inspection_point_code').notNull().references(() => itpInspectionPoints.code),
    value: boolean('value').notNull().default(false),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [uniqueIndex('inspection_test_plan_inspector_points_type_point_idx').on(table.inspectionTestPlanInspectorTypeId, table.inspectionPointCode)],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const serverOwned = { ...write, active: true } as const

export const itpInspectorType = createEntity({
  table: itpInspectorTypes,
  schemas: {
    create: createInsertSchema(itpInspectorTypes).omit(serverOwned),
    update: createUpdateSchema(itpInspectorTypes).omit(serverOwned),
    select: createSelectSchema(itpInspectorTypes),
  },
})

export const itpInspectionPoint = createEntity({
  table: itpInspectionPoints,
  schemas: {
    create: createInsertSchema(itpInspectionPoints).omit(serverOwned),
    update: createUpdateSchema(itpInspectionPoints).omit(serverOwned),
    select: createSelectSchema(itpInspectionPoints),
  },
})

export const inspectionTestPlan = createEntity({
  table: inspectionTestPlans,
  schemas: {
    create: createInsertSchema(inspectionTestPlans).omit(serverOwned),
    update: createUpdateSchema(inspectionTestPlans).omit(serverOwned),
    select: createSelectSchema(inspectionTestPlans),
  },
})

export const inspectionTestPlanInspectorType = createEntity({
  table: inspectionTestPlanInspectorTypes,
  schemas: {
    create: createInsertSchema(inspectionTestPlanInspectorTypes).omit(serverOwned),
    update: createUpdateSchema(inspectionTestPlanInspectorTypes).omit(serverOwned),
    select: createSelectSchema(inspectionTestPlanInspectorTypes),
  },
})

export const inspectionTestPlanInspectorPoint = createEntity({
  table: inspectionTestPlanInspectorPoints,
  schemas: {
    create: createInsertSchema(inspectionTestPlanInspectorPoints).omit(serverOwned),
    update: createUpdateSchema(inspectionTestPlanInspectorPoints).omit(serverOwned),
    select: createSelectSchema(inspectionTestPlanInspectorPoints),
  },
})
