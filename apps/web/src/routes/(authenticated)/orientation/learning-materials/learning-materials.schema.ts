import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { learningMaterial, learningMaterialAttachment, learningMaterialQuestion, questionWorkflow, questionUpdateWorkflow } from '@southneuhof/api/routes/orientation/orientation.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type LearningMaterial = z.output<typeof learningMaterial.schemas.select>
export type LearningMaterialCreate = z.input<typeof learningMaterial.schemas.create>
export type LearningMaterialUpdate = z.input<typeof learningMaterial.schemas.update>
export type LearningMaterialAttachment = z.output<typeof learningMaterialAttachment.schemas.select>
export type LearningMaterialQuestion = z.output<typeof learningMaterialQuestion.schemas.select>
export type LearningMaterialQuestionInput = z.input<typeof questionWorkflow>
export type LearningMaterialQuestionUpdate = z.input<typeof questionUpdateWorkflow>

export const learningMaterialsSchema = defineSchema<AppResourceContract<(typeof rpc)['learning-materials']>>({
  identity: 'id',
  record: { schema: fromZod(learningMaterial.schemas.select) },
  create: { schema: fromZod(learningMaterial.schemas.create) },
  update: { schema: fromZod(learningMaterial.schemas.update) },
})
