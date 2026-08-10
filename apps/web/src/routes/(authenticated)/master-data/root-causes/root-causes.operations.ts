import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { rootCause } from '@southneuhof/api/routes/root-causes/root-causes.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const rootCauseOperations = createHonoResourceOperations(rpc['root-causes'], dataAdapter)
export type RootCause = z.output<typeof rootCause.schemas.select>
export type RootCauseCreate = z.input<typeof rootCause.schemas.create>
export type RootCauseUpdate = z.input<typeof rootCause.schemas.update>
