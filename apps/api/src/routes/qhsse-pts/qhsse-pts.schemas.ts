import { z } from 'zod/v4'

const imageKey = z.string().trim().startsWith('uploads/', 'Image must use a retained upload.')

export const createReportSchema = z.object({
  date: z.string().trim().min(1),
  divisionId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  ptsWorkCategoryId: z.string().trim().min(1),
  workItemCategoryId: z.string().trim().min(1),
  workItemId: z.string().trim().min(1),
  criteriaCode: z.enum(['low', 'medium', 'high']),
  rootCauseIds: z.array(z.string().trim().min(1)).min(1),
  imgBefore: imageKey,
  location: z.string().trim().min(1),
  description: z.string().trim().min(1),
})
export const updateReportSchema = createReportSchema.partial().omit({ rootCauseIds: true })
export const actionSchemas = {
  disposition: z.object({
    dispositionStatusCode: z.string().trim().min(1),
    notes: z.string().trim().min(1),
  }),
  'temporary-plan': z.object({
    temporaryPlan: z.string().trim().min(1),
    targetDate: z.string().trim().min(1),
  }),
  'management-notes': z.object({
    managementNotes: z.string().trim().min(1),
    targetDate: z.string().trim().min(1),
  }),
  'complete-analysis': z.object({
    analysis: z.string().trim().min(1),
    targetDate: z.string().trim().min(1),
  }),
  'follow-up-implementation': z.object({
    implementationPlan: z.string().trim().min(1),
    targetDate: z.string().trim().min(1),
  }),
  'follow-up-price': z.object({
    priceFollowUp: z.string().trim().min(1),
    targetDate: z.string().trim().min(1),
    cost: z.string().trim().min(1),
  }),
  'implementation-report': z.object({
    implementationReport: z.string().trim().min(1),
    implementationDate: z.string().trim().min(1),
    cost: z.string().trim().min(1),
    imgProcess: imageKey,
    imgAfter: imageKey,
  }),
  verification: z.object({
    decision: z.enum(['approve', 'reject']),
    notes: z.string().trim().min(1),
  }),
  realization: z.object({
    realization: z.string().trim().min(1),
    date: z.string().trim().min(1),
    actualCost: z.string().trim().min(1),
    vendorId: z.string().trim().min(1),
  }),
  close: z.object({
    closeNotes: z.string().trim().min(1),
    closeDate: z.string().trim().min(1),
  }),
} as const
export type ActionName = keyof typeof actionSchemas
export type CreateReportInput = z.input<typeof createReportSchema>
export type UpdateReportInput = z.input<typeof updateReportSchema>
export type ActionInput = {
  [K in ActionName]: z.input<(typeof actionSchemas)[K]>
}[ActionName]
