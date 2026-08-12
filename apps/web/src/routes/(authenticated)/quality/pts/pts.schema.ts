import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { qhssePtsEntity } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.entity'
import { createReportSchema, updateReportSchema } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PtsCreate = z.input<typeof createReportSchema>
export type PtsUpdate = z.input<typeof updateReportSchema>

export const ptsSchema = defineSchema<AppResourceContract<typeof rpc['qhsse-pts']>>({
  identity: 'id',
  record: { schema: fromZod(qhssePtsEntity.schemas.select) },
  create: { schema: fromZod(createReportSchema) },
  update: { schema: fromZod(updateReportSchema) },
})

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
