import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { uom } from '@southneuhof/api/routes/uoms/uoms.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const uomOperations = createHonoResourceOperations(rpc.uoms, dataAdapter)
export type Uom = z.output<typeof uom.schemas.select>
export type UomCreate = z.input<typeof uom.schemas.create>
export type UomUpdate = z.input<typeof uom.schemas.update>
