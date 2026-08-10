import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { boolean, decimal, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { divisions, division } from '../divisions/divisions.entity'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

const locationSchema = z.object({
  address: z.string(),
  lat: z.number().finite().nullable(),
  lng: z.number().finite().nullable(),
})

export type ProjectLocation = z.infer<typeof locationSchema>

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    divisionId: text('division_id').notNull().references(() => divisions.id),
    number: text('number').notNull().unique(),
    integrationCode: text('integration_code').notNull().unique(),
    name: text('name').notNull(),
    shortName: text('short_name'),
    currentProgress: decimal('current_progress', { precision: 12, scale: 2 }).notNull().default('0'),
    location: jsonb('location').$type<ProjectLocation>(),
    startDate: text('start_date'),
    endDate: text('end_date'),
    imgThumbnail: text('img_thumbnail'),
    description: text('description'),
    isJo: boolean('is_jo').notNull().default(false),
    statusCode: text('status_code').notNull().default('active'),
    active: boolean('active').notNull().default(true),
    ...auditFields,
  },
  (table) => [index('projects_division_idx').on(table.divisionId)],
)

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const

export const project = createEntity({
  table: projects,
  schemas: {
    create: createInsertSchema(projects).omit(write).extend({
      shortName: z.string().trim().min(1).nullable().optional(),
      location: locationSchema.nullable().optional(),
    }),
    update: createUpdateSchema(projects).omit(write).extend({
      shortName: z.string().trim().min(1).nullable().optional(),
      location: locationSchema.nullable().optional(),
    }),
    select: createSelectSchema(projects).extend({
      shortName: z.string().nullable(),
      location: locationSchema.nullable(),
      division: division.schemas.select.nullable().optional(),
    }),
  },
})

export const projectRelations = defineRelationsPart({ divisions, projects }, (r) => ({
  projects: { division: r.one.divisions({ from: r.projects.divisionId, to: r.divisions.id }) },
}))
