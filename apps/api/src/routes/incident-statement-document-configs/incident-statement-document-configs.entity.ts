import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { users } from '../users/users.entity'

const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const incidentStatementDocumentConfigs = pgTable('incident_statement_document_configs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  fileAttachment: text('file_attachment'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const storedFile = z.string().trim().regex(/^uploads\/[a-z0-9-]+(?:\.[a-z0-9]{1,16})?$/, 'Document must use a retained upload.')

export const incidentStatementDocumentConfig = createEntity({
  table: incidentStatementDocumentConfigs,
  schemas: {
    create: createInsertSchema(incidentStatementDocumentConfigs).omit(write).extend({
      name: z.string().trim().min(1).max(255),
      fileAttachment: storedFile,
      description: z.string().nullable().optional(),
      active: z.boolean().default(true),
    }),
    update: createUpdateSchema(incidentStatementDocumentConfigs).omit(write).extend({
      name: z.string().trim().min(1).max(255).optional(),
      fileAttachment: storedFile.optional().nullable(),
      description: z.string().nullable().optional(),
      active: z.boolean().optional(),
    }),
    select: createSelectSchema(incidentStatementDocumentConfigs),
  },
})
