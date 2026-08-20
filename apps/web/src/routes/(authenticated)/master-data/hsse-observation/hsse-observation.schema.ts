import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { findingCategoryEntity, findingCauseEntity, findingCriteriaEntity, findingTypeEntity } from '@southneuhof/api/routes/hsse-observation/hsse-observation.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type FindingCriteria = z.output<typeof findingCriteriaEntity.schemas.select>
export type FindingCriteriaCreate = z.input<typeof findingCriteriaEntity.schemas.create>
export type FindingCriteriaUpdate = z.input<typeof findingCriteriaEntity.schemas.update>
export type FindingType = z.output<typeof findingTypeEntity.schemas.select>
export type FindingTypeCreate = z.input<typeof findingTypeEntity.schemas.create>
export type FindingTypeUpdate = z.input<typeof findingTypeEntity.schemas.update>
export type FindingCategory = z.output<typeof findingCategoryEntity.schemas.select>
export type FindingCategoryCreate = z.input<typeof findingCategoryEntity.schemas.create>
export type FindingCategoryUpdate = z.input<typeof findingCategoryEntity.schemas.update>
export type FindingCause = z.output<typeof findingCauseEntity.schemas.select>
export type FindingCauseCreate = z.input<typeof findingCauseEntity.schemas.create>
export type FindingCauseUpdate = z.input<typeof findingCauseEntity.schemas.update>

export const findingCriteriaSchema = defineSchema<AppResourceContract<(typeof rpc)['finding-criteria']>>({
  identity: 'id',
  record: { schema: fromZod(findingCriteriaEntity.schemas.select) },
  create: { schema: fromZod(findingCriteriaEntity.schemas.create) },
  update: { schema: fromZod(findingCriteriaEntity.schemas.update) },
})

export const findingTypesSchema = defineSchema<AppResourceContract<(typeof rpc)['finding-types']>>({
  identity: 'id',
  record: { schema: fromZod(findingTypeEntity.schemas.select) },
  create: { schema: fromZod(findingTypeEntity.schemas.create) },
  update: { schema: fromZod(findingTypeEntity.schemas.update) },
})

export const findingCategoriesSchema = defineSchema<AppResourceContract<(typeof rpc)['finding-categories']>>({
  identity: 'id',
  record: { schema: fromZod(findingCategoryEntity.schemas.select) },
  create: { schema: fromZod(findingCategoryEntity.schemas.create) },
  update: { schema: fromZod(findingCategoryEntity.schemas.update) },
})

export const findingCausesSchema = defineSchema<AppResourceContract<(typeof rpc)['finding-cause']>>({
  identity: 'id',
  record: { schema: fromZod(findingCauseEntity.schemas.select) },
  create: { schema: fromZod(findingCauseEntity.schemas.create) },
  update: { schema: fromZod(findingCauseEntity.schemas.update) },
})
