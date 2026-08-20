import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { syllabusCategory } from '@southneuhof/api/routes/orientation/orientation.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type SyllabusCategory = z.output<typeof syllabusCategory.schemas.select>
export type SyllabusCategoryCreate = z.input<typeof syllabusCategory.schemas.create>
export type SyllabusCategoryUpdate = z.input<typeof syllabusCategory.schemas.update>

export const syllabusCategoriesSchema = defineSchema<AppResourceContract<(typeof rpc)['syllabus-categories']>>({
  identity: 'id',
  record: { schema: fromZod(syllabusCategory.schemas.select) },
  create: { schema: fromZod(syllabusCategory.schemas.create) },
  update: { schema: fromZod(syllabusCategory.schemas.update) },
})
