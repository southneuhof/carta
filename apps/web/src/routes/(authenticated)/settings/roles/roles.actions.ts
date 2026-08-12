import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { RoleCreate, RoleUpdate } from './roles.schema'

const api = createHonoResourceActions(rpc.roles, dataAdapter)

function withoutRealm(input: RoleUpdate) {
  const payload = { ...input } as Record<string, unknown>
  delete payload.realm
  return payload as RoleUpdate
}

export const rolesActions = {
  list: api.list,
  detail: api.detail,
  create: (input: RoleCreate) => api.create(input),
  update: (id: Parameters<typeof api.update>[0], input: RoleUpdate) => api.update(id, withoutRealm(input)),
  delete: api.delete,
}
