import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { toolsType } from '@southneuhof/api/routes/tools-types/tools-types.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ToolsType = z.output<typeof toolsType.schemas.select>
export type ToolsTypeCreate = z.input<typeof toolsType.schemas.create>
export type ToolsTypeUpdate = z.input<typeof toolsType.schemas.update>

export const toolsTypesSchema = defineSchema<AppResourceContract<typeof rpc['tools-types']>>({
  identity: 'id',
  record: { schema: fromZod(toolsType.schemas.select) },
  create: { schema: fromZod(toolsType.schemas.create) },
  update: { schema: fromZod(toolsType.schemas.update) },
})

