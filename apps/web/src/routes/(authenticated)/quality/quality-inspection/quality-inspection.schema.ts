import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import {
  completeReportQualityInspectionSchema,
  createQualityInspectionSchema,
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

export const qualityInspectionSchema = defineSchema<AppResourceContract<typeof rpc['quality-inspection']>>({
  identity: 'id',
  record: { schema: fromZod(qualityInspectionRecordSchema) },
  create: { schema: fromZod(createQualityInspectionSchema) },
  update: { schema: fromZod(updateQualityInspectionSchema) },
})

export const statusOptions = [
  { id: 'open', name: 'Open' },
  { id: 'on-progress', name: 'On Progress' },
  { id: 'close', name: 'Closed' },
] as const

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

export const itpTypeOptions = [
  { id: 'material', name: 'Material' },
  { id: 'process', name: 'Process' },
  { id: 'product', name: 'Product' },
] as const
