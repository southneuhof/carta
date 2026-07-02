import { createEntity } from '../../model'
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const product = createEntity({
  table: products,
  schemas: {
    create: createInsertSchema(products),
    update: createUpdateSchema(products).omit({ id: true }),
    select: createSelectSchema(products),
  },
})
