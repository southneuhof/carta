import { z } from 'zod/v4'
import { createSelectSchema } from 'drizzle-zod'
import { inspectionTestPlans } from './inspection-test-plans.entity'

export const inspectionTestPlanTypes = ['material', 'process', 'product'] as const
export const inspectorTypeCodes = ['SC', 'HK', 'CONS', 'OWN', 'AUTH'] as const
export const inspectionPointCodes = ['P', 'R', 'W', 'SW', 'S', 'H'] as const

export const itpTypeSchema = z.enum(inspectionTestPlanTypes)
const textField = z.string().trim().nullable().optional()
const imageReference = z.string().trim().startsWith('uploads/', 'Image must use a retained upload.').nullable().optional()
const identity = z.string().trim().min(1)

export const inspectionPointInputSchema = z.object({
  inspectionPointCode: identity,
  value: z.boolean(),
})

export const inspectorGridEntrySchema = z.object({
  inspectorTypeId: identity,
  points: z.array(inspectionPointInputSchema),
})

const commonFields = {
  type: itpTypeSchema,
  criteria: textField,
  procedureCode: textField,
  specification: textField,
  method: textField,
  frequency: z.number().int().min(1),
  imgDocumentation: imageReference,
  description: z.string().trim().max(255).nullable().optional(),
  inspectors: z.array(inspectorGridEntrySchema),
}

export const createInspectionTestPlanSchema = z.object({
  workItemId: identity,
  ...commonFields,
})

export const updateInspectionTestPlanSchema = z.object({
  type: itpTypeSchema.optional(),
  criteria: textField,
  procedureCode: textField,
  specification: textField,
  method: textField,
  frequency: z.number().int().min(1).optional(),
  imgDocumentation: imageReference,
  description: z.string().trim().max(255).nullable().optional(),
  inspectors: z.array(inspectorGridEntrySchema),
})

export const inspectionTestPlanRowSchema = createSelectSchema(inspectionTestPlans).extend({
  allowedOperations: z.array(z.enum(['detail', 'update', 'delete'])),
})

const masterInspectorTypeSchema = z.object({ id: identity, code: identity, name: z.string() })
const masterInspectionPointSchema = z.object({ code: identity, name: z.string() })

export const inspectionTestPlanTemplateSchema = z.object({
  inspectorTypes: z.array(masterInspectorTypeSchema),
  inspectionPoints: z.array(masterInspectionPointSchema),
})

const inspectorPointSchema = z.object({
  id: identity,
  inspectionPointCode: identity,
  inspectionPointName: z.string(),
  value: z.boolean(),
})

const inspectorRecordSchema = z.object({
  id: identity,
  inspectionTestPlanId: identity,
  inspectorTypeId: identity,
  inspectorTypeCode: identity,
  inspectorTypeName: z.string(),
  points: z.array(inspectorPointSchema),
})

export const inspectionTestPlanRecordSchema = inspectionTestPlanRowSchema.extend({
  inspectors: z.array(inspectorRecordSchema),
})

export const inspectionTestPlanTreeRowSchema = inspectionTestPlanRowSchema.pick({
  id: true,
  workItemId: true,
  type: true,
  criteria: true,
  procedureCode: true,
  specification: true,
  method: true,
  frequency: true,
  imgDocumentation: true,
  description: true,
  active: true,
  allowedOperations: true,
})

export const inspectionTestPlanTreeNodeSchema = z.lazy(() => z.object({
  id: identity,
  projectId: identity,
  parentId: identity.nullable(),
  level: z.number().int(),
  code: z.string(),
  name: z.string(),
  isLeaf: z.boolean(),
  availableTypes: z.array(itpTypeSchema),
  itps: z.array(inspectionTestPlanTreeRowSchema),
  children: z.array(inspectionTestPlanTreeNodeSchema),
}))

export const inspectionTestPlanTreeSchema = z.array(inspectionTestPlanTreeNodeSchema)

export type InspectionTestPlanType = z.infer<typeof itpTypeSchema>
export type InspectionPointInput = z.infer<typeof inspectionPointInputSchema>
export type InspectorGridEntry = z.infer<typeof inspectorGridEntrySchema>
export type CreateInspectionTestPlanInput = z.input<typeof createInspectionTestPlanSchema>
export type UpdateInspectionTestPlanInput = z.input<typeof updateInspectionTestPlanSchema>
export type InspectionTestPlanTemplate = z.infer<typeof inspectionTestPlanTemplateSchema>
export type InspectionTestPlanRow = z.infer<typeof inspectionTestPlanRowSchema>
export type InspectionTestPlanRecord = z.infer<typeof inspectionTestPlanRecordSchema>
export type InspectionTestPlanTreeRow = z.infer<typeof inspectionTestPlanTreeRowSchema>
export type InspectionTestPlanTreeNode = {
  id: string
  projectId: string
  parentId: string | null
  level: number
  code: string
  name: string
  isLeaf: boolean
  availableTypes: InspectionTestPlanType[]
  itps: z.infer<typeof inspectionTestPlanTreeRowSchema>[]
  children: InspectionTestPlanTreeNode[]
}
