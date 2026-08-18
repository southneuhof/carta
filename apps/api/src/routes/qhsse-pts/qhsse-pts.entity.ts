import { createEntity } from '@southneuhof/sprindle/entity'
import { decimal, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { divisions } from '../divisions/divisions.entity'
import { projects } from '../projects/projects.entity'
import { projectVendors } from '../project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { rootCauses } from '../root-causes/root-causes.entity'
import { workItems } from '../work-items/work-items.entity'
import { users } from '../users/users.entity'

export const qhssePts = pgTable(
  'qhsse_pts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    divisionId: text('division_id').notNull().references(() => divisions.id),
    projectId: text('project_id').notNull().references(() => projects.id),
    number: text('number').notNull().unique(),
    ptsWorkCategoryId: text('pts_work_category_id').notNull().references(() => ptsWorkCategories.id),
    workItemCategoryId: text('work_item_category_id').notNull().references(() => workItems.id),
    workItemId: text('work_item_id').notNull().references(() => workItems.id),
    source: text('source'),
    locationZone: text('location_zone'),
    criteriaCode: text('criteria_code'),
    imgBefore: text('img_before'),
    location: text('location'),
    description: text('description'),
    somUserId: text('som_user_id').references(() => users.id),
    dispositionStatusCode: text('disposition_status_code'),
    temporaryFollowUpPlan: text('temporary_follow_up_plan'),
    managementNotes: text('management_notes'),
    followUpPlan: text('follow_up_plan'),
    targetDate: text('target_date'),
    implementationUserId: text('implementation_user_id').references(() => users.id),
    workMethod: text('work_method'),
    estimationCost: decimal('estimation_cost', { precision: 14, scale: 2 }),
    jobImplementorType: text('job_implementor_type'),
    projectVendorId: text('project_vendor_id').references(() => projectVendors.id),
    implementationDate: text('implementation_date'),
    imgProcess: text('img_process'),
    imgAfter: text('img_after'),
    implementationDescription: text('implementation_description'),
    implementationStatusCode: text('implementation_status_code'),
    implementationVerificationDescription: text('implementation_verification_description'),
    actualCost: decimal('actual_cost', { precision: 14, scale: 2 }),
    actualJobImplementorType: text('actual_job_implementor_type'),
    actualProjectVendorId: text('actual_project_vendor_id').references(() => projectVendors.id),
    statusCode: text('status_code').notNull().default('open'),
    stepCode: text('step_code').notNull().default('report'),
    createdBy: text('created_by').notNull().references(() => users.id),
    updatedBy: text('updated_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
    deletedBy: text('deleted_by').references(() => users.id),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    deletedReason: text('deleted_reason'),
  },
  (table) => [
    index('qhsse_pts_project_idx').on(table.projectId),
    index('qhsse_pts_division_idx').on(table.divisionId),
    index('qhsse_pts_status_step_idx').on(table.statusCode, table.stepCode),
    index('qhsse_pts_created_at_idx').on(table.createdAt),
    uniqueIndex('qhsse_pts_open_qi_source_idx').on(table.projectId, table.workItemId).where(sql`${table.source} = 'qi-report' and ${table.statusCode} <> 'close' and ${table.deletedAt} is null`),
  ],
)

export const qhssePtsRootCauses = pgTable(
  'qhsse_pts_root_cause',
  {
    qhssePtsId: text('qhsse_pts_id').notNull().references(() => qhssePts.id, { onDelete: 'cascade' }),
    rootCauseId: text('root_cause_id').notNull().references(() => rootCauses.id),
  },
  (table) => [primaryKey({ columns: [table.qhssePtsId, table.rootCauseId] })],
)

export const qhssePtsNumberCounters = pgTable(
  'qhsse_pts_number_counters',
  {
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    lastNumber: integer('last_number').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.year] })],
)

const audit = {
  id: true,
  number: true,
  statusCode: true,
  stepCode: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedBy: true,
  deletedAt: true,
  deletedReason: true,
  source: true,
} as const

export const qhssePtsEntity = createEntity({
  table: qhssePts,
  schemas: {
    create: createInsertSchema(qhssePts).omit(audit),
    update: createUpdateSchema(qhssePts).omit(audit),
    select: createSelectSchema(qhssePts),
  },
})
