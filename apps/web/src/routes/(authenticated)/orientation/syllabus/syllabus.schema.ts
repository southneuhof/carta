import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { syllabus } from '@southneuhof/api/routes/orientation/orientation.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type Syllabus = z.output<typeof syllabus.schemas.select>
export type SyllabusCreate = z.input<typeof syllabus.schemas.create>
export type SyllabusUpdate = z.input<typeof syllabus.schemas.update>

export const syllabusSchema = defineSchema<AppResourceContract<(typeof rpc)['syllabus']>>({
  identity: 'id',
  record: { schema: fromZod(syllabus.schemas.select) },
  create: { schema: fromZod(syllabus.schemas.create) },
  update: { schema: fromZod(syllabus.schemas.update) },
})
