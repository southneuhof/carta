import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, decimal, index, integer, pgTable, text, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { projects, project } from '../projects/projects.entity'
import { users } from '../users/users.entity'
import { uoms, uom } from '../uoms/uoms.entity'
import { ptsWorkCategories, ptsWorkCategory } from '../pts-work-categories/pts-work-categories.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const workItems = pgTable(
  'work_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id').notNull().references(() => projects.id),
    parentId: text('parent_id').references((): AnyPgColumn => workItems.id),
    categoryId: text('category_id').references(() => ptsWorkCategories.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isHighRisk: boolean('is_high_risk').notNull().default(false),
    level: integer('level').notNull().default(0),
    volume: decimal('volume', { precision: 12, scale: 2 }),
    uomId: text('uom_id').references(() => uoms.id),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('work_items_project_idx').on(table.projectId), index('work_items_parent_idx').on(table.parentId)],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const serverOwned = { ...write, level: true, active: true } as const

export const workItem = createEntity({
  table: workItems,
  schemas: {
    create: createInsertSchema(workItems).omit(serverOwned).extend({ code: z.string().optional(), level: z.number().int().optional() }),
    update: createUpdateSchema(workItems).omit(serverOwned),
    select: createSelectSchema(workItems).extend({
      project: project.schemas.select.nullable().optional(),
      category: ptsWorkCategory.schemas.select.nullable().optional(),
      uom: uom.schemas.select.nullable().optional(),
    }),
  },
})

export const workItemRelations = defineRelationsPart({ projects, ptsWorkCategories, uoms, workItems }, (r) => ({
  workItems: {
    project: r.one.projects({ from: r.workItems.projectId, to: r.projects.id }),
    category: r.one.ptsWorkCategories({ from: r.workItems.categoryId, to: r.ptsWorkCategories.id }),
    uom: r.one.uoms({ from: r.workItems.uomId, to: r.uoms.id }),
  },
}))
