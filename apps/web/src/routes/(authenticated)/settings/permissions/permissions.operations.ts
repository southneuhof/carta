import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { permission } from '@southneuhof/api/routes/roles/roles.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export type Permission = z.output<typeof permission.schemas.select>
export type PermissionCreate = z.input<typeof permission.schemas.create>
export type PermissionUpdate = z.input<typeof permission.schemas.update>
export const permissionOperations = defineResourceOperations<Permission, Record<string, never>, PermissionCreate, PermissionUpdate>()(createHonoResourceOperations(rpc.permissions, dataAdapter))
