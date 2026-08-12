import type { Coordinate } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { ProjectCreate, ProjectUpdate } from './projects.schema'

const api = createHonoResourceActions(rpc.projects, dataAdapter)

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

export const projectsActions = {
  list: api.list,
  detail: async (context: Parameters<typeof api.detail>[0]) => {
    const record = await api.detail(context)
    return record ? { ...record, location: location(record.location) } : record
  },
  create: (input: ProjectCreate) => api.create({ ...input, location: storedLocation(input.location) } as ProjectCreate),
  update: (id: Parameters<typeof api.update>[0], input: ProjectUpdate) => api.update(id, { ...input, location: storedLocation(input.location) } as ProjectUpdate),
  delete: api.delete,
}
