import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { project } from '@southneuhof/api/routes/projects/projects.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ProjectCreate = z.input<typeof project.schemas.create>
export type ProjectUpdate = z.input<typeof project.schemas.update>
export type ProjectQuery = {
  page?: number | string
  limit?: number | string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  active?: 'true' | 'false'
  statusCode?: string
  implementationStatusCode?: 'on-progress' | 'finished' | 'draft'
}

export const projectsSchema = defineSchema<AppResourceContract<typeof rpc.projects>>({
  identity: 'id',
  record: { schema: fromZod(project.schemas.select) },
  create: { schema: fromZod(project.schemas.create) },
  update: { schema: fromZod(project.schemas.update) },
})
