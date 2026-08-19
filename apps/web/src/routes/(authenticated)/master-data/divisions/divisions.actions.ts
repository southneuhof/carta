import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { fileUrl } from '@/framework/adapters/storage'
import { rpc } from '@/framework/rpc'
import type { DivisionCreate, DivisionUpdate } from './divisions.schema'

const api = createHonoResourceActions(rpc.divisions, dataAdapter)

function asset(value: unknown) {
  if (typeof value === 'string') return { kind: 'file', path: value, url: fileUrl(value), name: value.split('/').pop() }
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (typeof record.path !== 'string') return value
  return {
    kind: 'file',
    path: record.path,
    url: typeof record.url === 'string' ? record.url : fileUrl(record.path),
    name: typeof record.name === 'string' ? record.name : record.path.split('/').pop(),
  }
}

function stored(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  return typeof record.path === 'string' ? record.path : value
}

export const divisionsActions = {
  list: api.list,
  detail: async (context: Parameters<typeof api.detail>[0]) => {
    const record = await api.detail(context)
    return record ? { ...record, imgThumbnail: asset(record.imgThumbnail) } : record
  },
  create: (input: DivisionCreate) => api.create({ ...input, imgThumbnail: stored(input.imgThumbnail) } as DivisionCreate),
  update: (id: Parameters<typeof api.update>[0], input: DivisionUpdate) => api.update(id, { ...input, imgThumbnail: stored(input.imgThumbnail) } as DivisionUpdate),
  delete: api.delete,
}
