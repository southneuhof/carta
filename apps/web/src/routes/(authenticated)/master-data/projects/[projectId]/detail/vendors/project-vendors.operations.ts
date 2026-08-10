import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import { projectVendor } from '@southneuhof/api/routes/project-vendors/project-vendors.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const projectVendorOperations = defineResourceOperations<ProjectVendor, Record<string, never>, ProjectVendorCreate, ProjectVendorUpdate>()(createHonoResourceOperations(rpc['project-vendors'], dataAdapter))
export type ProjectVendor = z.output<typeof projectVendor.schemas.select> & Record<string, unknown>
export type ProjectVendorCreate = z.input<typeof projectVendor.schemas.create>
export type ProjectVendorUpdate = z.input<typeof projectVendor.schemas.update>
