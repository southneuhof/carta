import { defineSchema, fromZod } from '@southneuhof/loom'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z as Zod } from 'zod/v4'

export type Role = Zod.output<typeof role.schemas.select>
export type RoleCreate = Zod.input<typeof role.schemas.create>
export type RoleUpdate = Zod.input<typeof role.schemas.update>

export const rolesSchema = defineSchema<AppResourceContract<typeof rpc.roles>>({
  identity: 'id',
  record: { schema: fromZod(role.schemas.select) },
  create: { schema: fromZod(role.schemas.create) },
  update: { schema: fromZod(role.schemas.update) },
})
