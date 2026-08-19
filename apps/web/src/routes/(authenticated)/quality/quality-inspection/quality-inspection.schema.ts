import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import {
  completeReportQualityInspectionSchema,
  createQualityInspectionSchema,
  qualityInspectionListQuerySchema,
  qualityInspectionRecordSchema,
  submitQualityInspectionDocumentationsSchema,
  updateQualityInspectionSchema,
  verifyQualityInspectionSchema,
  verifyQualityInspectionWorkItemItpSchema,
} from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import type { z } from 'zod/v4'

export type QualityInspectionCreate = z.input<typeof createQualityInspectionSchema>
export type QualityInspectionUpdate = z.input<typeof updateQualityInspectionSchema>
export type CompleteQualityInspection = z.input<typeof completeReportQualityInspectionSchema>
export type VerifyQualityInspectionWorkItem = z.input<typeof verifyQualityInspectionWorkItemItpSchema>
export type SubmitQualityInspectionDocumentations = z.input<typeof submitQualityInspectionDocumentationsSchema>
export type VerifyQualityInspection = z.input<typeof verifyQualityInspectionSchema>

export const qualityInspectionSchema = defineSchema<AppResourceContract<(typeof rpc)['quality-inspection']>>({
  identity: 'id',
  record: { schema: fromZod(qualityInspectionRecordSchema) },
  query: { schema: fromZod(qualityInspectionListQuerySchema) },
  create: { schema: fromZod(createQualityInspectionSchema) },
  update: { schema: fromZod(updateQualityInspectionSchema) },
})

export const statusOptions = [
  { id: 'open', name: 'Open' },
  { id: 'on-progress', name: 'On Progress' },
  { id: 'close', name: 'Closed' },
] as const

export const statusLabels = Object.fromEntries(statusOptions.map(({ id, name }) => [id, name])) as Record<string, string>
export const statusColors: Record<string, 'info' | 'warning' | 'success'> = {
  open: 'info',
  'on-progress': 'warning',
  close: 'success',
}

export const stepLabels: Record<string, string> = {
  report: 'Dilaporkan',
  'complete-report': 'Laporan Terlengkapi',
  inspected: 'Terinspeksi',
  submitted: 'Dokumentasi Terlengkapi',
  close: 'Terverifikasi',
}

export const resultOptions = [
  { id: 'approved', name: 'Diterima' },
  { id: 'rejected', name: 'Ditolak' },
  { id: 'repair', name: 'Diperbaiki' },
  { id: 'pending', name: 'Ditunda' },
] as const

export const resultLabels = Object.fromEntries(resultOptions.map(({ id, name }) => [id, name])) as Record<string, string>
export const resultColors: Record<string, 'success' | 'error' | 'warning'> = {
  approved: 'success',
  rejected: 'error',
  repair: 'warning',
  pending: 'warning',
}

export const itpTypeOptions = [
  { id: 'material', name: 'Material' },
  { id: 'process', name: 'Proses' },
  { id: 'product', name: 'Product' },
] as const

export const itpTypeLabels = Object.fromEntries(itpTypeOptions.map(({ id, name }) => [id, name])) as Record<string, string>

export const acceptanceCriteriaLabels = {
  material: 'Kriteria/Tolok Ukur Penerimaan (Material)',
  process: 'Kriteria/Tolok Ukur Penerimaan (Proses)',
  product: 'Kriteria/Tolok Ukur Penerimaan (Product)',
} as const
