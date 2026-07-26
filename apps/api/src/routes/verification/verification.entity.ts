import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { employees, jobPositions, sectionTypes } from '../organization/organization.entity'
import { users } from '../users/users.entity'

/**
 * Who verifies a given step. `jobPosition` names a position directly; the other
 * two resolve through the org chart to the coordinator of the submitter's section
 * group or the head of their ranting.
 */
export const verificatorTypes = ['jobPosition', 'sectionGroupHead', 'sectionRantingHead'] as const
export type VerificatorType = (typeof verificatorTypes)[number]

/**
 * The configured chain for a module, keyed by `(moduleName, sectionTypeId)` and
 * ordered by `orderNumber`. `orderNumber` starts at 1 — the reference system's
 * `order_number == 0` sentinel for "not yet seeded" is not reproduced, because
 * plan 024 seeds the whole chain when a record is submitted.
 */
export const configVerificators = pgTable('config_verificators', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  moduleName: text('module_name').notNull(),
  sectionTypeId: text('section_type_id').references(() => sectionTypes.id),
  orderNumber: integer('order_number').notNull(),
  verificatorType: text('verificator_type').notNull().$type<VerificatorType>(),
  jobPositionId: text('job_position_id').references(() => jobPositions.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

/** One step of one record's chain, materialized from `configVerificators` at submit. */
export const logVerificationStatuses = ['pending', 'waiting', 'approved', 'rejected'] as const
export type LogVerificationStatus = (typeof logVerificationStatuses)[number]

export const logVerifications = pgTable('log_verifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  moduleName: text('module_name').notNull(),
  moduleId: text('module_id').notNull(),
  orderNumber: integer('order_number').notNull(),
  verificatorType: text('verificator_type').notNull().$type<VerificatorType>(),
  jobPositionId: text('job_position_id').references(() => jobPositions.id),
  recipientEmployeeId: text('recipient_employee_id').references(() => employees.id),
  statusCode: text('status_code').notNull().default('pending').$type<LogVerificationStatus>(),
  verifiedByUserId: text('verified_by_user_id').references(() => users.id),
  verifiedAt: timestamp('verified_at', { mode: 'string' }),
  verifiedDescription: text('verified_description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})
