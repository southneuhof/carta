import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { projectVendor } from '@southneuhof/api/routes/project-vendors/project-vendors.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ProjectVendorCreate = z.input<typeof projectVendor.schemas.create>
export type ProjectVendorUpdate = z.input<typeof projectVendor.schemas.update>

export const projectVendorsSchema = defineSchema<AppResourceContract<typeof rpc['project-vendors']>>({
  identity: 'id',
  record: { schema: fromZod(projectVendor.schemas.select) },
  create: { schema: fromZod(projectVendor.schemas.create) },
  update: { schema: fromZod(projectVendor.schemas.update) },
})
