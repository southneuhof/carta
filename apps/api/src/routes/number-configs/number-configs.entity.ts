import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart, sql } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp, uniqueIndex, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { numberVariables, numberVariable } from '../number-variables/number-variables.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const numberConfigs = pgTable(
  'number_configs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    numberVariableCode: text('number_variable_code').notNull().references(() => numberVariables.code),
    numberOfDigits: integer('number_of_digits').notNull().default(0),
    customCode: text('custom_code'),
    displayOrder: integer('display_order').notNull().default(sql`nextval('number_configs_display_order_seq')`),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [
    index('number_configs_variable_idx').on(table.numberVariableCode),
    uniqueIndex('number_configs_active_order_idx').on(table.displayOrder).where(sql`active = true`),
  ],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const numberConfig = createEntity({
  table: numberConfigs,
  schemas: {
    create: createInsertSchema(numberConfigs).omit({ ...write, displayOrder: true }),
    update: createUpdateSchema(numberConfigs).omit({ ...write, displayOrder: true }),
    select: createSelectSchema(numberConfigs).extend({ numberVariable: numberVariable.schemas.select.nullable().optional() }),
  },
})

export const numberConfigRelations = defineRelationsPart({ numberVariables, numberConfigs }, (r) => ({
  numberConfigs: { numberVariable: r.one.numberVariables({ from: r.numberConfigs.numberVariableCode, to: r.numberVariables.code }) },
}))
