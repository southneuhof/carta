import { defineSchema } from '@southneuhof/is-vue-framework'
import type { WebResourceSchema } from '@southneuhof/is-vue-framework'

export type RolePermission = {
  id: string
  permissionCode: string
  name: string
  description: string | null
  module: { id: string; code: string; name: string; realm: string }
  assigned: boolean
}
export type RolePermissionSchema = WebResourceSchema<RolePermission, Record<string, unknown>, Record<string, never>, Record<string, never>, string>

export const rolePermissionsSchema = defineSchema<RolePermissionSchema>({ identity: 'id' })
