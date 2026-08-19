import { z } from 'zod/v4'
import { createSelectSchema } from 'drizzle-zod'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import {
  qualityInspections,
  qualityInspectionDocumentations,
  qualityInspectionPtsRejections,
  qualityInspectionVerifications,
  qualityInspectionWorkItemItps,
  qualityInspectionWorkItemItpSnapshots,
  qualityInspectionWorkItemItpSnapshotInspectors,
  qualityInspectionWorkItemItpSnapshotPoints,
  qualityInspectionWorkItemItpVerifications,
} from './quality-inspection.entity'
import { activityLogs } from '../notifications/notifications.entity'

const textValue = z.string().trim().min(1)
const dateValue = z.string().trim().min(1)
export const qualityInspectionItpTypes = ['material', 'process', 'product'] as const
export const qualityInspectionItemResults = ['approved', 'rejected'] as const
export const qualityInspectionResults = ['approved', 'rejected', 'repair', 'pending'] as const
export const qualityInspectionPhotoNames = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
export const qualityInspectionContextOperations = ['create', 'update'] as const
export const qualityInspectionContextOperationSchema = z.enum(qualityInspectionContextOperations)
const qualityInspectionMonthQuery = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM.')

export const qualityInspectionListQuerySchema = listQuerySchema.extend({
  projectId: z.string().optional(),
  statusCode: z.enum(['open', 'on-progress', 'close']).optional(),
  stepCode: z.enum(['report', 'complete-report', 'inspected', 'submitted', 'close']).optional(),
  startMonth: qualityInspectionMonthQuery.optional(),
  endMonth: qualityInspectionMonthQuery.optional(),
})

const positiveVolume = z.union([z.number().finite(), z.string().trim().regex(/^\d+(?:\.\d+)?$/)]).refine((value) => Number(value) > 0, 'Volume must be greater than zero.')

export const selectedWorkItemSchema = z.object({
  workItemId: textValue,
  volume: positiveVolume,
  itpTypeCodes: z.array(z.enum(qualityInspectionItpTypes)).min(1),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.itpTypeCodes).size !== value.itpTypeCodes.length) ctx.addIssue({ code: 'custom', path: ['itpTypeCodes'], message: 'Each ITP type can be selected only once.' })
})

const selectedRows = z.array(selectedWorkItemSchema).min(1)
const reportFields = {
  targetDate: dateValue,
  locationZone: textValue.optional(),
  selectedRows,
}

export const manualQualityInspectionCreateSchema = z.object({
  divisionId: textValue,
  projectId: textValue,
  qualityWorkCategoryId: textValue,
  workItemCategoryId: textValue,
  ...reportFields,
}).strict()

export const scheduledQualityInspectionCreateSchema = z.object({
  scheduleId: textValue,
  ...reportFields,
}).strict()

export const createQualityInspectionSchema = z.union([manualQualityInspectionCreateSchema, scheduledQualityInspectionCreateSchema])
export const updateQualityInspectionSchema = z.object({
  targetDate: dateValue.optional(),
  locationZone: textValue.nullable().optional(),
  divisionId: textValue.optional(),
  projectId: textValue.optional(),
  qualityWorkCategoryId: textValue.optional(),
  workItemCategoryId: textValue.optional(),
  selectedRows: z.array(selectedWorkItemSchema).min(1).optional(),
}).strict()

export const completeReportQualityInspectionSchema = z.object({
  inspectionPointCode: textValue,
  workMethod: textValue,
}).strict()

export const verifyQualityInspectionWorkItemItpSchema = z.object({
  resultCode: z.enum(qualityInspectionItemResults),
  description: textValue.optional(),
}).strict()

export const submitQualityInspectionDocumentationsSchema = z.object({
  documentations: z.array(z.object({
    name: z.enum(qualityInspectionPhotoNames),
    fileAttachment: textValue.startsWith('uploads/', 'Documentation must use a retained upload.'),
    description: textValue.optional(),
  }).strict()).length(4),
}).strict().superRefine((value, ctx) => {
  const names = new Set(value.documentations.map((item) => item.name))
  if (names.size !== qualityInspectionPhotoNames.length || qualityInspectionPhotoNames.some((name) => !names.has(name))) {
    ctx.addIssue({ code: 'custom', path: ['documentations'], message: 'All four documentation slots are required.' })
  }
})

export const verifyQualityInspectionSchema = z.object({
  resultCode: z.enum(qualityInspectionResults),
  description: textValue.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.resultCode !== 'approved' && !value.description) ctx.addIssue({ code: 'custom', path: ['description'], message: 'Description is required for this result.' })
})

export const qualityInspectionRecordSchema = createSelectSchema(qualityInspections)
export const qualityInspectionItemRecordSchema = createSelectSchema(qualityInspectionWorkItemItps)
export const qualityInspectionSnapshotRecordSchema = createSelectSchema(qualityInspectionWorkItemItpSnapshots)
export const qualityInspectionSnapshotInspectorRecordSchema = createSelectSchema(qualityInspectionWorkItemItpSnapshotInspectors)
export const qualityInspectionSnapshotPointRecordSchema = createSelectSchema(qualityInspectionWorkItemItpSnapshotPoints)
export const qualityInspectionItemVerificationRecordSchema = createSelectSchema(qualityInspectionWorkItemItpVerifications)
export const qualityInspectionDocumentationRecordSchema = createSelectSchema(qualityInspectionDocumentations)
export const qualityInspectionVerificationRecordSchema = createSelectSchema(qualityInspectionVerifications)
export const qualityInspectionPtsRejectionRecordSchema = createSelectSchema(qualityInspectionPtsRejections)
export const qualityInspectionActivityRecordSchema = createSelectSchema(activityLogs)

export type SelectedWorkItemInput = z.input<typeof selectedWorkItemSchema>
export type CreateQualityInspectionInput = z.input<typeof createQualityInspectionSchema>
export type UpdateQualityInspectionInput = z.input<typeof updateQualityInspectionSchema>
export type CompleteReportQualityInspectionInput = z.input<typeof completeReportQualityInspectionSchema>
export type VerifyQualityInspectionWorkItemItpInput = z.input<typeof verifyQualityInspectionWorkItemItpSchema>
export type SubmitQualityInspectionDocumentationsInput = z.input<typeof submitQualityInspectionDocumentationsSchema>
export type VerifyQualityInspectionInput = z.input<typeof verifyQualityInspectionSchema>
export type QualityInspectionContextOperation = z.input<typeof qualityInspectionContextOperationSchema>
export type QualityInspectionItemVerification = z.infer<typeof qualityInspectionItemVerificationRecordSchema> & { verifierName: string | null }
export type QualityInspectionVerification = z.infer<typeof qualityInspectionVerificationRecordSchema> & { verifierName: string | null }
export type QualityInspectionPtsRejection = z.infer<typeof qualityInspectionPtsRejectionRecordSchema> & { rejectingUserName: string | null }
export type QualityInspectionActivity = z.infer<typeof qualityInspectionActivityRecordSchema> & { actorName: string | null }

export type QualityInspectionTreeNode = {
  id: string
  projectId: string
  parentId: string | null
  level: number
  code: string
  name: string
  categoryName: string | null
  volume: string | null
  uomName: string | null
  isHighRisk: boolean
  isLeaf: boolean
  itps: Array<{ id: string; type: string; criteria: string | null; procedureCode: string | null; specification: string | null; method: string | null; frequency: number; imgDocumentation: string | null; description: string | null }>
  children: QualityInspectionTreeNode[]
}

export type QualityInspectionRecord = z.infer<typeof qualityInspectionRecordSchema> & {
  project?: { id: string; number: string; name: string }
  division?: { id: string; code: string; name: string }
  qualityWorkCategory?: { id: string; code: string; name: string }
  workItemCategory?: { id: string; code: string; name: string }
  createdByUser?: { id: string; name: string }
  workItems: Array<{
    row: z.infer<typeof qualityInspectionItemRecordSchema>
    workItem: { id: string; code: string; name: string; uomName: string | null }
    allowedActions: string[]
    snapshots: Array<z.infer<typeof qualityInspectionSnapshotRecordSchema> & { inspectors: Array<z.infer<typeof qualityInspectionSnapshotInspectorRecordSchema> & { points: Array<z.infer<typeof qualityInspectionSnapshotPointRecordSchema>> }> }>
    verifications: Array<QualityInspectionItemVerification>
    pts?: { id: string; number: string; statusCode: string; stepCode: string }
  }>
  documentations: Array<z.infer<typeof qualityInspectionDocumentationRecordSchema>>
  verifications: Array<QualityInspectionVerification>
  ptsRejections: Array<QualityInspectionPtsRejection>
  activity: Array<QualityInspectionActivity>
  allowedOperations: string[]
  allowedActions: string[]
}
