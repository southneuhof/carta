import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { date, integer, pgTable, text, time, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { employees, tollSection, tollSections } from '../organization/organization.entity'
import { employee } from '../employees/employees.entity'
import { users } from '../users/users.entity'

/**
 * `draft`    — created, chain not seeded.
 * `waiting`  — at least one chain step is outstanding.
 * `approved` — every step approved.
 * `rejected` — a step rejected, which ends the chain.
 */
export const overtimeStatuses = ['draft', 'waiting', 'approved', 'rejected'] as const
export type OvertimeStatus = (typeof overtimeStatuses)[number]

/**
 * `estimatedMinutes` is what the applicant asks for. The reference system also
 * computes a *realized* duration by cross-checking approved overtime against
 * attendance records; that needs an attendance subsystem and is deliberately not
 * modelled here.
 */
export const overtimes = pgTable('overtimes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sectionId: text('section_id').notNull().references(() => tollSections.id),
  applicantEmployeeId: text('applicant_employee_id').notNull().references(() => employees.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  description: text('description'),
  statusCode: text('status_code').notNull().default('draft').$type<OvertimeStatus>(),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

export const overtimeRelations = defineRelationsPart({ overtimes, employees, tollSections }, (r) => ({
  overtimes: {
    applicant: r.one.employees({ from: r.overtimes.applicantEmployeeId, to: r.employees.id }),
    section: r.one.tollSections({ from: r.overtimes.sectionId, to: r.tollSections.id }),
  },
}))

/**
 * Derived from the caller, never from the client: a client that could set
 * `applicantEmployeeId` could file overtime in someone else's name, and one that
 * could set `statusCode` could skip the chain entirely.
 *
 * They stay *in* the create schema because the source parses input against it and
 * strips anything absent — omitting them would drop the values the model's `before`
 * hook derives. The guarantee comes from that hook assigning them unconditionally
 * after the body is read, so an inbound value is always overwritten. `update`
 * omits them outright: they must not change after creation.
 */
const derivedFromCaller = { sectionId: true, applicantEmployeeId: true, createdByUserId: true, statusCode: true } as const

export const overtime = createEntity({
  table: overtimes,
  schemas: {
    create: createInsertSchema(overtimes).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(overtimes).omit({ id: true, createdAt: true, updatedAt: true, ...derivedFromCaller }),
    select: createSelectSchema(overtimes).extend({
      applicant: employee.schemas.select.nullable(),
      section: tollSection.schemas.select.nullable(),
    }),
  },
})
