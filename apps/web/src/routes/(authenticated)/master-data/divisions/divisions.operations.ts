import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import { division } from '@southneuhof/api/routes/divisions/divisions.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { fileUrl } from '@/framework/adapters/storage'

const transport = createHonoResourceOperations(rpc.divisions, dataAdapter)
function asset(value: unknown) {
  if (typeof value === 'string') return { kind: 'file', path: value, url: fileUrl(value), name: value.split('/').pop() }
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (typeof record.path !== 'string') return value
  return { kind: 'file', path: record.path, url: typeof record.url === 'string' ? record.url : fileUrl(record.path), name: typeof record.name === 'string' ? record.name : record.path.split('/').pop() }
}
function stored(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  return typeof record.path === 'string' ? record.path : value
}

export const divisionOperations = defineResourceOperations<Division, Record<string, never>, DivisionCreate, DivisionUpdate>()({
  list: transport.list,
  detail: async (context) => {
    const record = await transport.detail(context)
    return record ? { ...record, imgThumbnail: asset(record.imgThumbnail) } : record
  },
  create: (input) => transport.create({ ...input, imgThumbnail: stored(input.imgThumbnail) } as DivisionCreate),
  update: (id, input) => transport.update(id, { ...input, imgThumbnail: stored(input.imgThumbnail) } as DivisionUpdate),
  delete: transport.delete,
})
export type Division = z.output<typeof division.schemas.select> & Record<string, unknown>
export type DivisionCreate = z.input<typeof division.schemas.create>
export type DivisionUpdate = z.input<typeof division.schemas.update>
