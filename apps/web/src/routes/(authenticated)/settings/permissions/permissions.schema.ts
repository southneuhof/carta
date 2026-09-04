import { defineSchema } from '@southneuhof/loom'
import type { WebResourceSchema } from '@southneuhof/loom'
import { permission } from '@southneuhof/api/routes/roles/roles.entity'
import type { z } from 'zod/v4'

export type Permission = z.output<typeof permission.schemas.select>

export type PermissionSchema = WebResourceSchema<Permission, Record<string, unknown>, Record<string, never>, Record<string, never>, string>

export const permissionsSchema = defineSchema<PermissionSchema>({ identity: 'id' })
