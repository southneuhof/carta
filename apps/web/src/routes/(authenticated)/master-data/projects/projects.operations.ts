import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import { project } from '@southneuhof/api/routes/projects/projects.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { locationOperations } from '@/framework/adapters/location'
import type { Coordinate } from '@southneuhof/is-vue-framework'

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

const transport = createHonoResourceOperations(rpc.projects, dataAdapter)
function location(value: unknown): Coordinate | unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (typeof record.address !== 'string') return value
  return { lat: typeof record.lat === 'number' ? record.lat : 0, lng: typeof record.lng === 'number' ? record.lng : 0, formatted_address: record.address }
}
function storedLocation(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (typeof record.address === 'string' && typeof record.lat === 'number' && typeof record.lng === 'number') return value
  if (typeof record.lat !== 'number' || typeof record.lng !== 'number') return value
  return { address: typeof record.formatted_address === 'string' ? record.formatted_address : typeof record.name === 'string' ? record.name : '', lat: record.lat, lng: record.lng }
}

export { locationOperations }
export const projectOperations = defineResourceOperations<Project, ProjectQuery, ProjectCreate, ProjectUpdate>()({
  list: transport.list,
  detail: async (context) => {
    const record = await transport.detail(context)
    return record ? { ...record, location: location(record.location) } : record
  },
  create: (input) => transport.create({ ...input, location: storedLocation(input.location) } as ProjectCreate),
  update: (id, input) => transport.update(id, { ...input, location: storedLocation(input.location) } as ProjectUpdate),
  delete: transport.delete,
})
export type Project = z.output<typeof project.schemas.select> & Record<string, unknown>
export type ProjectCreate = z.input<typeof project.schemas.create>
export type ProjectUpdate = z.input<typeof project.schemas.update>
