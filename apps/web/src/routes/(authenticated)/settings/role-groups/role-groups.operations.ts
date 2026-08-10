import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { roleGroup } from '@southneuhof/api/routes/roles/roles.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export type RoleGroup = z.output<typeof roleGroup.schemas.select>
export type RoleGroupCreate = z.input<typeof roleGroup.schemas.create>
export type RoleGroupUpdate = z.input<typeof roleGroup.schemas.update>
export const roleGroupOperations = defineResourceOperations<RoleGroup, Record<string, never>, RoleGroupCreate, RoleGroupUpdate>()(createHonoResourceOperations(rpc['role-groups'], dataAdapter))
