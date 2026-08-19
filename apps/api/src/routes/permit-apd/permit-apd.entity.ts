import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { permitCategoryApds } from '../permit-category-apd/permit-category-apd.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const permitApds = pgTable('permit_apd', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  permitCategoryApdId: text('permit_category_apd_id').notNull().references(() => permitCategoryApds.id),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

const insertSchema = createInsertSchema(permitApds).omit(write)
const updateSchema = createUpdateSchema(permitApds).omit({ ...write, permitCategoryApdId: true })

export const permitApd = createEntity({
  table: permitApds,
  schemas: {
    create: insertSchema.extend({
      permitCategoryApdId: z.string().trim().min(1),
      name: z.string().trim().min(1).max(255),
      code: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().default(true),
    }),
    update: updateSchema.extend({
      name: z.string().trim().min(1).max(255).optional(),
      code: z.string().trim().max(255).nullable().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(permitApds),
  },
})
