import { createEntity } from '@southneuhof/sprindle/entity'
import { sql } from 'drizzle-orm'
import { boolean, check, decimal, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { divisions } from '../divisions/divisions.entity'
import { inspectionTestPlans, itpInspectionPoints } from '../inspection-test-plans/inspection-test-plans.entity'
import { projects } from '../projects/projects.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { qhssePts } from '../qhsse-pts/qhsse-pts.entity'
import { users } from '../users/users.entity'
import { workItems } from '../work-items/work-items.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').notNull().references(() => users.id),
  updatedByUserId: text('updated_by_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const workItemSchedules = pgTable('work_item_schedule', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  startDate: text('start_date'),
  endDate: text('end_date'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [index('work_item_schedule_project_idx').on(table.projectId), index('work_item_schedule_work_item_idx').on(table.workItemId)])

export const qualityInspectionNumberCounters = pgTable('quality_inspection_number_counters', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.projectId, table.year] })])

export const qualityInspections = pgTable('quality_inspection', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  divisionId: text('division_id').notNull().references(() => divisions.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  number: text('number').notNull().unique(),
  targetDate: text('target_date').notNull(),
  qualityWorkCategoryId: text('quality_work_category_id').notNull().references(() => ptsWorkCategories.id),
  workItemCategoryId: text('work_item_category_id').notNull().references(() => workItems.id),
  locationZone: text('location_zone'),
  inspectionPointCode: text('inspection_point_code').references(() => itpInspectionPoints.code),
  workMethod: text('work_method'),
  scheduleId: text('schedule_id').references(() => workItemSchedules.id),
  scheduleStartDate: text('schedule_start_date'),
  scheduleEndDate: text('schedule_end_date'),
  statusCode: text('status_code').notNull().default('open'),
  stepCode: text('step_code').notNull().default('report'),
  resultCode: text('result_code'),
  verificationDescription: text('verification_description'),
  ...auditFields,
  deletedByUserId: text('deleted_by_user_id').references(() => users.id),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  deletedReason: text('deleted_reason'),
}, (table) => [
  index('quality_inspection_project_idx').on(table.projectId),
  index('quality_inspection_status_step_idx').on(table.statusCode, table.stepCode),
  check('quality_inspection_status_check', sql`${table.statusCode} in ('open', 'on-progress', 'close')`),
  check('quality_inspection_step_check', sql`${table.stepCode} in ('report', 'complete-report', 'inspected', 'submitted', 'close')`),
  check('quality_inspection_result_check', sql`${table.resultCode} is null or ${table.resultCode} in ('approved', 'rejected', 'repair', 'pending')`),
])

export const qualityInspectionWorkItemItps = pgTable('quality_inspection_work_item_itp', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionId: text('quality_inspection_id').notNull().references(() => qualityInspections.id, { onDelete: 'cascade' }),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  volume: decimal('volume', { precision: 14, scale: 2 }).notNull(),
  statusCode: text('status_code').notNull().default('waiting'),
  verificationDescription: text('verification_description'),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { mode: 'string' }),
  qhssePtsId: text('qhsse_pts_id').references(() => qhssePts.id),
  ...auditFields,
}, (table) => [
  uniqueIndex('quality_inspection_work_item_itp_report_work_item_idx').on(table.qualityInspectionId, table.workItemId),
  check('quality_inspection_work_item_itp_volume_check', sql`${table.volume} > 0`),
  check('quality_inspection_work_item_itp_status_check', sql`${table.statusCode} in ('waiting', 'approved', 'rejected')`),
])

export const qualityInspectionWorkItemItpSnapshots = pgTable('quality_inspection_work_item_itp_snapshot', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionWorkItemItpId: text('quality_inspection_work_item_itp_id').notNull().references(() => qualityInspectionWorkItemItps.id, { onDelete: 'cascade' }),
  sourceItpId: text('source_itp_id').notNull().references(() => inspectionTestPlans.id),
  type: text('type').notNull(),
  criteria: text('criteria'),
  procedureCode: text('procedure_code'),
  specification: text('specification'),
  method: text('method'),
  frequency: integer('frequency').notNull(),
  imgDocumentation: text('img_documentation'),
  description: text('description'),
  ...auditFields,
}, (table) => [uniqueIndex('quality_inspection_work_item_itp_snapshot_row_type_idx').on(table.qualityInspectionWorkItemItpId, table.type)])

export const qualityInspectionWorkItemItpSnapshotInspectors = pgTable('quality_inspection_work_item_itp_snapshot_inspector', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text('snapshot_id').notNull().references(() => qualityInspectionWorkItemItpSnapshots.id, { onDelete: 'cascade' }),
  inspectorTypeCode: text('inspector_type_code').notNull(),
  inspectorTypeName: text('inspector_type_name').notNull(),
  ...auditFields,
}, (table) => [uniqueIndex('quality_inspection_work_item_itp_snapshot_inspector_type_idx').on(table.snapshotId, table.inspectorTypeCode)])

export const qualityInspectionWorkItemItpSnapshotPoints = pgTable('quality_inspection_work_item_itp_snapshot_point', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotInspectorId: text('snapshot_inspector_id').notNull().references(() => qualityInspectionWorkItemItpSnapshotInspectors.id, { onDelete: 'cascade' }),
  inspectionPointCode: text('inspection_point_code').notNull(),
  inspectionPointName: text('inspection_point_name').notNull(),
  value: boolean('value').notNull().default(false),
  ...auditFields,
}, (table) => [uniqueIndex('quality_inspection_work_item_itp_snapshot_point_idx').on(table.snapshotInspectorId, table.inspectionPointCode)])

export const qualityInspectionWorkItemItpVerifications = pgTable('quality_inspection_work_item_itp_verification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionWorkItemItpId: text('quality_inspection_work_item_itp_id').notNull().references(() => qualityInspectionWorkItemItps.id, { onDelete: 'cascade' }),
  resultCode: text('result_code').notNull(),
  description: text('description'),
  verifierId: text('verifier_id').notNull().references(() => users.id),
  verifiedAt: timestamp('verified_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [check('quality_inspection_work_item_itp_verification_result_check', sql`${table.resultCode} in ('approved', 'rejected')`)])

export const qualityInspectionDocumentations = pgTable('quality_inspection_documentations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionId: text('quality_inspection_id').notNull().references(() => qualityInspections.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  fileAttachment: text('file_attachment'),
  description: text('description'),
  ...auditFields,
}, (table) => [
  uniqueIndex('quality_inspection_documentations_report_name_idx').on(table.qualityInspectionId, table.name),
  check('quality_inspection_documentations_name_check', sql`${table.name} in ('sudut 1', 'sudut 2', 'sudut 3', 'sudut 4')`),
])

export const qualityInspectionVerifications = pgTable('quality_inspection_verification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionId: text('quality_inspection_id').notNull().references(() => qualityInspections.id, { onDelete: 'cascade' }),
  resultCode: text('result_code').notNull(),
  description: text('description'),
  resultingStatusCode: text('resulting_status_code').notNull(),
  resultingStepCode: text('resulting_step_code').notNull(),
  verifierId: text('verifier_id').notNull().references(() => users.id),
  verifiedAt: timestamp('verified_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [check('quality_inspection_verification_result_check', sql`${table.resultCode} in ('approved', 'rejected', 'repair', 'pending')`)])

export const qualityInspectionPtsRejections = pgTable('quality_inspection_pts_rejection', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  qualityInspectionId: text('quality_inspection_id').notNull().references(() => qualityInspections.id, { onDelete: 'cascade' }),
  qualityInspectionWorkItemItpId: text('quality_inspection_work_item_itp_id').notNull().references(() => qualityInspectionWorkItemItps.id, { onDelete: 'cascade' }),
  qhssePtsId: text('qhsse_pts_id').notNull().references(() => qhssePts.id),
  note: text('note'),
  rejectingUserId: text('rejecting_user_id').notNull().references(() => users.id),
  rejectedAt: timestamp('rejected_at', { mode: 'string' }).notNull().defaultNow(),
})

const readEntity = (table: any) => createEntity({
  table,
  schemas: {
    create: z.object({}).strict(),
    update: z.object({}).strict(),
    select: createSelectSchema(table),
  },
})

export const workItemSchedule = readEntity(workItemSchedules)
export const qualityInspection = readEntity(qualityInspections)
export const qualityInspectionWorkItemItp = readEntity(qualityInspectionWorkItemItps)
export const qualityInspectionWorkItemItpSnapshot = readEntity(qualityInspectionWorkItemItpSnapshots)
export const qualityInspectionWorkItemItpSnapshotInspector = readEntity(qualityInspectionWorkItemItpSnapshotInspectors)
export const qualityInspectionWorkItemItpSnapshotPoint = readEntity(qualityInspectionWorkItemItpSnapshotPoints)
export const qualityInspectionWorkItemItpVerification = readEntity(qualityInspectionWorkItemItpVerifications)
export const qualityInspectionDocumentation = readEntity(qualityInspectionDocumentations)
export const qualityInspectionVerification = readEntity(qualityInspectionVerifications)
export const qualityInspectionPtsRejection = readEntity(qualityInspectionPtsRejections)
