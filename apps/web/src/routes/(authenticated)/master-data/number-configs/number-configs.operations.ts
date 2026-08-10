import { createHonoResourceOperations, parseHonoResponse } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import { numberConfig } from '@southneuhof/api/routes/number-configs/number-configs.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const numberConfigOperations = defineResourceOperations<NumberConfig, Record<string, never>, NumberConfigCreate, NumberConfigUpdate>()(createHonoResourceOperations(rpc['number-configs'], dataAdapter))
export type NumberConfig = z.output<typeof numberConfig.schemas.select> & Record<string, unknown>
export type NumberConfigCreate = z.input<typeof numberConfig.schemas.create>
export type NumberConfigUpdate = z.input<typeof numberConfig.schemas.update>

export async function reorderNumberConfig(id: string, direction: 'up' | 'down') {
  const endpoint = rpc['number-configs'][':id'].reorder.$post
  return parseHonoResponse<typeof endpoint>(await endpoint({ param: { id }, json: { direction } }))
}
