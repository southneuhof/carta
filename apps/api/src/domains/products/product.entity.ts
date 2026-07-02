import { createEntity, registerEntity, registerRelations, registerTable } from '@southneuhof/domain/model'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { productVariant, productVariants } from '../product-variants/product-variant.entity'
import { user, users } from '../users/user.entity'

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  ownerId: text('owner_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const productRelations = relations(products, ({ one, many }) => ({
  author: one(users, {
    fields: [products.ownerId],
    references: [users.id],
  }),
  variants: many(productVariants),
}))

export const productVariantRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}))

export const product = createEntity({
  table: products,
  schemas: {
    create: createInsertSchema(products),
    update: createUpdateSchema(products).omit({ id: true }),
    select: createSelectSchema(products).extend({
      author: user.schemas.select.nullable(),
      variants: z.array(z.lazy(() => productVariant.schemas.select)),
    }),
  },
})

registerTable(products)
registerRelations(productRelations)
registerRelations(productVariantRelations)
registerEntity(product)
