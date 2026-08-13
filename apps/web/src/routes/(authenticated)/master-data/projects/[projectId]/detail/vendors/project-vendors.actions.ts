import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { ProjectVendorCreate, ProjectVendorUpdate } from './project-vendors.schema'

const api = createHonoResourceActions(rpc['project-vendors'], dataAdapter)

export const projectVendorActions = {
  lookupList: api.list,
  list: (projectId: string) => (context: Parameters<typeof api.list>[0]) => api.list({ ...context, searchParameters: { ...context.searchParameters, projectId } }),
  detail: api.detail,
  create: (projectId: string) => (input: ProjectVendorCreate) => api.create({ ...input, projectId } as ProjectVendorCreate),
  update: (projectId: string) => (id: Parameters<typeof api.update>[0], input: ProjectVendorUpdate) => api.update(id, { ...input, projectId } as ProjectVendorUpdate),
  delete: api.delete,
}
