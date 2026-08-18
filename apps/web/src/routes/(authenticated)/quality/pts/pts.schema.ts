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

export const stepLabels: Record<string, string> = {
  report: 'Report',
  'qi-report': 'Inspection/Test report',
  'high-disposition': 'High disposition',
  'low-disposition': 'Low disposition',
  'temporary-plan': 'Temporary plan',
  'management-notes': 'Management notes',
  'complete-report': 'Complete report',
  'follow-up-implementation': 'Implementation follow-up',
  'follow-up-price': 'Price follow-up',
  'follow-up': 'Follow-up',
  'implementation-report': 'Implementation report',
  'approved-implementation': 'Approved implementation',
  realization: 'Realization',
  close: 'Closed',
}

export const dispositionLabels = Object.fromEntries(dispositionOptions.map(({ id, name }) => [id, name])) as Record<string, string>
export const criteriaLabels = Object.fromEntries(criteriaOptions.map(({ id, name }) => [id, name])) as Record<string, string>
export const jobImplementorLabels = Object.fromEntries(jobImplementorOptions.map(({ id, name }) => [id, name])) as Record<string, string>

export function codeLabel(value: unknown, labels: Record<string, string> = {}) {
  const code = String(value ?? '')
  if (!code) return '—'
  return labels[code] ?? code.replace(/[-_]+/g, ' ').replace(/^\w/, (character) => character.toUpperCase())
}
