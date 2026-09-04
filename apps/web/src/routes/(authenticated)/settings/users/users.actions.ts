import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

const api = createHonoResourceActions(rpc.users)

export const usersActions = {
  list: api.list,
  detail: api.detail,
  create: api.create,
  update: api.update,
}
