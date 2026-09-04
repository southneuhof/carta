import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const permissionsActions = createHonoResourceActions(rpc.permissions)
