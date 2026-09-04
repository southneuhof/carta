import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { RoleCreate, RoleUpdate } from './roles.schema'

const api = createHonoResourceActions(rpc.roles)

export const rolesActions = {
  list: api.list,
  detail: api.detail,
  create: (input: RoleCreate) => api.create(input),
  update: (id: Parameters<typeof api.update>[0], input: RoleUpdate) => api.update(id, input),
  delete: api.delete,
}
