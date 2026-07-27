import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { employees, jobPositions, tollSections, tollSection, jobPosition } from '../organization/organization.entity'
import { role, roles } from '../roles/roles.entity'
import { users } from '../users/users.entity'

/**
 * Read state of one notification.
 *
 * `unseen` — delivered and unread.
 * `seen`   — read.
 * `unset`  — **not a read state.** It marks a chain step whose turn has not come:
 *            the row exists so the timeline is complete, but the recipient is not
 *            meant to see it yet. Plan 024 flips it to `unseen` when the step
 *            activates. Counting `unset` as unread inflates every badge in the
 *            system, which is the likeliest subtle bug in this subsystem.
 */
export const notificationStatuses = ['unseen', 'seen', 'unset'] as const
export type NotificationStatus = (typeof notificationStatuses)[number]

/**
 * Targeting is polymorphic: any combination of the three target columns may be
 * set, and all of them are narrowed by `sectionId`.
 *
 * `recipientEmployeeId` is the column the reference system calls `user_receiver_id`.
 * Despite that name it holds an **employee** id, not a user id — every consumer
 * joins through `employees` to reach `user_id`. The name here says what it holds.
 */
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipientEmployeeId: text('recipient_employee_id').references(() => employees.id),
  jobPositionId: text('job_position_id').references(() => jobPositions.id),
  roleId: text('role_id').references(() => roles.id),
  sectionId: text('section_id').references(() => tollSections.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  statusCode: text('status_code').notNull().default('unseen').$type<NotificationStatus>(),
  notificationType: text('notification_type').notNull(),
  moduleName: text('module_name').notNull(),
  moduleId: text('module_id'),
  payload: jsonb('payload'),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

export const notificationRelations = defineRelationsPart({ notifications, jobPositions, roles, tollSections }, (r) => ({
  notifications: {
    jobPosition: r.one.jobPositions({ from: r.notifications.jobPositionId, to: r.jobPositions.id }),
    role: r.one.roles({ from: r.notifications.roleId, to: r.roles.id }),
    section: r.one.tollSections({ from: r.notifications.sectionId, to: r.tollSections.id }),
  },
}))

export const notification = createEntity({
  table: notifications,
  schemas: {
    create: createInsertSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(notifications).extend({
      statusCode: z.enum(notificationStatuses),
      jobPosition: jobPosition.schemas.select.nullable(),
      role: role.schemas.select.nullable(),
      section: tollSection.schemas.select.nullable(),
    }),
  },
})
