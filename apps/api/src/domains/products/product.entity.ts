import { createEntity } from '@southneuhof/sprindle/model'
import { defineRelationsPart } from 'drizzle-orm'
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

export const productRelations = defineRelationsPart({ products, users, productVariants }, (r) => ({
  products: {
    author: r.one.users({
      from: r.products.ownerId,
      to: r.users.id,
    }),
    variants: r.many.productVariants({
      from: r.products.id,
      to: r.productVariants.productId,
    }),
  },
}))

export const product = createEntity({
  table: products,
  schemas: {
    create: createInsertSchema(products).extend({
      author: user.schemas.select.pick({ id: true }).nullable().optional(),
      variants: z.array(productVariant.schemas.select.pick({ id: true })).optional(),
    }),
    update: createUpdateSchema(products).omit({ id: true }).extend({
      author: user.schemas.select.pick({ id: true }).nullable().optional(),
      variants: z.array(productVariant.schemas.select.pick({ id: true })).optional(),
    }),
    select: createSelectSchema(products).extend({
      author: user.schemas.select.nullable(),
      variants: z.array(productVariant.schemas.select),
    }),
  },
})
