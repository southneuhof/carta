import { defineSchema } from '@southneuhof/is-vue-framework'
import type { WebResourceSchema } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { authorizationModule, permission } from '@southneuhof/api/routes/roles/roles.entity'
import type { z } from 'zod/v4'

export type PermissionRecord = z.output<typeof permission.schemas.select>
type Module = z.output<typeof authorizationModule.schemas.select>
export type Permission = PermissionRecord & {
  module: Pick<Module, 'id' | 'code' | 'name' | 'realm' | 'active'>
}

export type PermissionSchema = WebResourceSchema<Permission, Record<string, unknown>, Record<string, never>, Record<string, never>, string>

export const permissionsSchema = defineSchema<PermissionSchema>({ identity: 'id' })
