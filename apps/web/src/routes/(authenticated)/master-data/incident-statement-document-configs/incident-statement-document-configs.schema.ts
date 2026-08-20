import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfig } from '@southneuhof/api/routes/incident-statement-document-configs/incident-statement-document-configs.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type IncidentStatementDocumentConfig = z.output<typeof incidentStatementDocumentConfig.schemas.select>
export type IncidentStatementDocumentConfigCreate = z.input<typeof incidentStatementDocumentConfig.schemas.create>
export type IncidentStatementDocumentConfigUpdate = z.input<typeof incidentStatementDocumentConfig.schemas.update>

export const incidentStatementDocumentConfigsSchema = defineSchema<AppResourceContract<(typeof rpc)['incident-statement-document-configs']>>({
  identity: 'id',
  record: { schema: fromZod(incidentStatementDocumentConfig.schemas.select) },
  create: { schema: fromZod(incidentStatementDocumentConfig.schemas.create) },
  update: { schema: fromZod(incidentStatementDocumentConfig.schemas.update) },
})
