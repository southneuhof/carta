import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { projects, project } from '../projects/projects.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const projectVendors = pgTable(
  'project_vendors',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id').notNull().references(() => projects.id),
    name: text('name').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('project_vendors_project_idx').on(table.projectId)],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const projectVendor = createEntity({
  table: projectVendors,
  schemas: {
    create: createInsertSchema(projectVendors).omit(write),
    update: createUpdateSchema(projectVendors).omit(write),
    select: createSelectSchema(projectVendors).extend({ project: project.schemas.select.nullable().optional() }),
  },
})

export const projectVendorRelations = defineRelationsPart({ projects, projectVendors }, (r) => ({
  projectVendors: { project: r.one.projects({ from: r.projectVendors.projectId, to: r.projects.id }) },
}))
