import { createEntity, registerEntity, registerTable } from '@southneuhof/domain/model'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  sku: text('sku').notNull(),
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

registerTable(productVariants)
registerEntity(productVariant)
