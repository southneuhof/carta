import { z } from 'zod/v4'

const textValue = z.string().trim().min(1)
const imageKey = textValue.startsWith('uploads/', 'Image must use a retained upload.')
const cost = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, 'Cost must be a valid amount.')

export const criteriaCodes = ['low', 'medium', 'high'] as const
export const dispositionValues = ['approved', 'repair', 'downgrade', 'demolish'] as const
export const jobImplementorTypes = ['internal', 'vendor'] as const
export const implementationStatuses = ['waiting', 'approved', 'rejected'] as const

export const createReportSchema = z.object({
  divisionId: textValue,
  projectId: textValue,
  ptsWorkCategoryId: textValue,
  workItemCategoryId: textValue,
  workItemId: textValue,
  locationZone: textValue.optional(),
  criteriaCode: z.enum(criteriaCodes),
  rootCauseIds: z.array(textValue).min(1),
  location: textValue,
  imgBefore: imageKey,
  description: textValue.optional(),
})

export const updateReportSchema = createReportSchema.partial().extend({ rootCauseIds: z.array(textValue).min(1).optional() })

const vendorFields = () => z.object({
  jobImplementorType: z.enum(jobImplementorTypes),
  projectVendorId: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.jobImplementorType === 'vendor' && !value.projectVendorId) ctx.addIssue({ code: 'custom', path: ['projectVendorId'], message: 'Vendor is required.' })
})

export const actionSchemas = {
  disposition: z.object({ dispositionStatusCode: z.enum(dispositionValues) }),
  'temporary-plan': z.object({ temporaryFollowUpPlan: textValue }),
  'management-notes': z.object({ managementNotes: textValue }),
  'complete-report': z.object({ somUserId: textValue, followUpPlan: textValue, targetDate: textValue }),
  'follow-up-implementation': z.object({ implementationUserId: textValue, workMethod: textValue }),
  'follow-up-price': z.object({ estimationCost: cost }).and(vendorFields()),
  'implementation-report': z.object({ implementationDate: textValue, imgProcess: imageKey, imgAfter: imageKey, implementationDescription: textValue.optional() }),
  'verify-implementation': z.object({ implementationStatusCode: z.enum(['approved', 'rejected']), implementationVerificationDescription: textValue.optional() }),
  realization: z.object({ actualCost: cost }).and(z.object({ actualJobImplementorType: z.enum(jobImplementorTypes), actualProjectVendorId: z.string().trim().min(1).optional() })).superRefine((value, ctx) => {
    if (value.actualJobImplementorType === 'vendor' && !value.actualProjectVendorId) ctx.addIssue({ code: 'custom', path: ['actualProjectVendorId'], message: 'Vendor is required.' })
  }),
  close: z.object({}),
  delete: z.object({ deletedReason: textValue }),
} as const

export type ActionName = keyof typeof actionSchemas
export type ActionInput = { [K in ActionName]: z.input<(typeof actionSchemas)[K]> }[ActionName]
export type CreateReportInput = z.input<typeof createReportSchema>
export type UpdateReportInput = z.input<typeof updateReportSchema>
