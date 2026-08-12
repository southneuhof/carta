import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { qhssePtsEntity } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.entity'
import { createReportSchema, updateReportSchema } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PtsCreate = z.input<typeof createReportSchema>
export type PtsUpdate = z.input<typeof updateReportSchema>

export type PtsQuery = {
  page?: number | string
  limit?: number | string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  divisionId?: string
  projectId?: string
  statusCode?: 'open' | 'on-progress' | 'close'
  stepCode?: string
  criteriaCode?: 'low' | 'medium' | 'high'
  startMonth?: string
  endMonth?: string
  rootCauseId?: string
}

export const ptsSchema = defineSchema<AppResourceContract<typeof rpc['qhsse-pts']>>({
  identity: 'id',
  record: { schema: fromZod(qhssePtsEntity.schemas.select) },
  create: { schema: fromZod(createReportSchema) },
  update: { schema: fromZod(updateReportSchema) },
})

export type LookupOption = {
  id: string
  name: string
  code?: string
  projectId?: string
  divisionId?: string
  parentId?: string | null
  categoryId?: string | null
}

export type PtsLookups = {
  divisions: LookupOption[]
  projects: LookupOption[]
  ptsWorkCategories: LookupOption[]
  workItems: LookupOption[]
  rootCauses: LookupOption[]
  projectVendors: LookupOption[]
  projectUsers: LookupOption[]
}

export const dispositionOptions = [
  { id: 'approved', name: 'Tetap Dipakai' },
  { id: 'repair', name: 'Diperbaiki' },
  { id: 'downgrade', name: 'Diturunkan Mutu (dengan persetujuan pengguna jasa)' },
  { id: 'demolish', name: 'Dibongkar dan Dikerjakan Ulang' },
] as const

export const criteriaOptions = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
] as const

export const jobImplementorOptions = [
  { id: 'internal', name: 'Internal' },
  { id: 'vendor', name: 'Vendor/Subkon' },
] as const
