import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { numberVariable } from '@southneuhof/api/routes/number-variables/number-variables.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const numberVariableOperations = createHonoResourceOperations(rpc['number-variables'], dataAdapter)
export type NumberVariable = z.output<typeof numberVariable.schemas.select>
export type NumberVariableCreate = z.input<typeof numberVariable.schemas.create>
export type NumberVariableUpdate = z.input<typeof numberVariable.schemas.update>
