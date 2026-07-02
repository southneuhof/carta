import { createEntity } from '@southneuhof/domain/model'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { products } from '../products/product.entity'

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  sku: text('sku').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const productVariantRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}))

export const productVariant = createEntity({
  table: productVariants,
  schemas: {
    create: createInsertSchema(productVariants),
    update: createUpdateSchema(productVariants).omit({ id: true }),
    select: createSelectSchema(productVariants),
  },
})
