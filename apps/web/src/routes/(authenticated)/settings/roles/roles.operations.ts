import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

const transport = createHonoResourceOperations(rpc.roles, dataAdapter)

export const roleOperations = defineResourceOperations<Role, Record<string, never>, RoleCreate, RoleUpdate>()({
  list: transport.list,
  detail: transport.detail,
  create: transport.create,
  update: (id, input) => {
    const payload = { ...input } as Record<string, unknown>
    delete payload.realm
    return transport.update(id, payload as RoleUpdate)
  },
  delete: transport.delete,
})
export type Role = z.output<typeof role.schemas.select>
export type RoleCreate = z.input<typeof role.schemas.create>
export type RoleUpdate = z.input<typeof role.schemas.update>
