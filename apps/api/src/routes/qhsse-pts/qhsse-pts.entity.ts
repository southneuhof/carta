import { createEntity } from '@southneuhof/sprindle/entity'
import { decimal, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { divisions, projects, projectVendors, rootCauses, ptsWorkCategories, workItems } from '../master-data/master-data.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const qhssePts = pgTable(
  'qhsse_pts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: text('date').notNull(),
    divisionId: text('division_id')
      .notNull()
      .references(() => divisions.id),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    number: text('number').notNull().unique(),
    source: text('source').notNull().default('pts-report'),
    ptsWorkCategoryId: text('pts_work_category_id')
      .notNull()
      .references(() => ptsWorkCategories.id),
    workItemCategoryId: text('work_item_category_id')
      .notNull()
      .references(() => workItems.id),
    workItemId: text('work_item_id')
      .notNull()
      .references(() => workItems.id),
    criteriaCode: text('criteria_code').notNull(),
    imgBefore: text('img_before').notNull(),
    imgProcess: text('img_process'),
    imgAfter: text('img_after'),
    location: text('location').notNull(),
    description: text('description').notNull(),
    somUserId: text('som_user_id').references(() => users.id),
    dispositionStatusCode: text('disposition_status_code'),
    dispositionNotes: text('disposition_notes'),
    temporaryPlan: text('temporary_plan'),
    temporaryPlanTargetDate: text('temporary_plan_target_date'),
    managementNotes: text('management_notes'),
    managementNotesTargetDate: text('management_notes_target_date'),
    analysis: text('analysis'),
    analysisTargetDate: text('analysis_target_date'),
    implementationPlan: text('implementation_plan'),
    implementationPlanTargetDate: text('implementation_plan_target_date'),
    followUpImplementationDoneAt: text('follow_up_implementation_done_at'),
    priceFollowUp: text('price_follow_up'),
    priceFollowUpTargetDate: text('price_follow_up_target_date'),
    priceFollowUpCost: decimal('price_follow_up_cost', {
      precision: 14,
      scale: 2,
    }),
    followUpPriceDoneAt: text('follow_up_price_done_at'),
    implementationReport: text('implementation_report'),
    implementationDate: text('implementation_date'),
    implementationCost: decimal('implementation_cost', {
      precision: 14,
      scale: 2,
    }),
    realization: text('realization'),
    realizationDate: text('realization_date'),
    actualCost: decimal('actual_cost', { precision: 14, scale: 2 }),
    vendorId: text('vendor_id').references(() => projectVendors.id),
    verificationStatusCode: text('verification_status_code'),
    verificationNotes: text('verification_notes'),
    closeNotes: text('close_notes'),
    closeDate: text('close_date'),
    statusCode: text('status_code').notNull().default('open'),
    stepCode: text('step_code').notNull().default('report'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: text('updated_by')
      .notNull()
      .references(() => users.id),
    ...auditFields,
  },
  (table) => [
    index('qhsse_pts_project_idx').on(table.projectId),
    index('qhsse_pts_division_idx').on(table.divisionId),
    index('qhsse_pts_status_step_idx').on(table.statusCode, table.stepCode),
    index('qhsse_pts_date_idx').on(table.date),
  ]
)

export const qhssePtsRootCauses = pgTable(
  'qhsse_pts_root_cause',
  {
    qhssePtsId: text('qhsse_pts_id')
      .notNull()
      .references(() => qhssePts.id, { onDelete: 'cascade' }),
    rootCauseId: text('root_cause_id')
      .notNull()
      .references(() => rootCauses.id),
  },
  (table) => [primaryKey({ columns: [table.qhssePtsId, table.rootCauseId] }), uniqueIndex('qhsse_pts_root_cause_pair_idx').on(table.qhssePtsId, table.rootCauseId)]
)

export const qhssePtsNumberCounters = pgTable(
  'qhsse_pts_number_counters',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    lastNumber: integer('last_number').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.year] })]
)

const write = {
  id: true,
  source: true,
  number: true,
  statusCode: true,
  stepCode: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const

export const qhssePtsEntity = createEntity({
  table: qhssePts,
  schemas: {
    create: createInsertSchema(qhssePts).omit(write),
    update: createUpdateSchema(qhssePts).omit(write),
    select: createSelectSchema(qhssePts),
  },
})
