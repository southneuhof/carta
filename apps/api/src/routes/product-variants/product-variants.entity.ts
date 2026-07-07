import { createEntity } from '@southneuhof/sprindle/model'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const productVariant = createEntity({
  table: productVariants,
  schemas: {
    create: createInsertSchema(productVariants),
    update: createUpdateSchema(productVariants).omit({ id: true }),
    select: createSelectSchema(productVariants),
  },
})
