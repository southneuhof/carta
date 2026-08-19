import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { permitWorkTypes } from '../permit-work-types/permit-work-types.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const permitAttachments = pgTable('permit_attachment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  permitWorkTypeId: text('permit_work_type_id').references(() => permitWorkTypes.id, { onDelete: 'cascade' }),
  ...auditFields,
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

const insertSchema = createInsertSchema(permitAttachments).omit(write)
const updateSchema = createUpdateSchema(permitAttachments).omit({ ...write, permitWorkTypeId: true })

export const permitAttachment = createEntity({
  table: permitAttachments,
  schemas: {
    create: insertSchema.extend({
      name: z.string().trim().min(1).max(255),
      code: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().default(true),
    }),
    update: updateSchema.extend({
      name: z.string().trim().min(1).max(255).optional(),
      code: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(permitAttachments),
  },
})
