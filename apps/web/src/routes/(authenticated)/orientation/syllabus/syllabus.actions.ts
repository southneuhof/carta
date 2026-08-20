import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { SyllabusCreate, SyllabusUpdate } from './syllabus.schema'

const api = createHonoResourceActions(rpc.syllabus, dataAdapter)

export const syllabusActions = {
  list: api.list,
  detail: api.detail,
  create: (input: SyllabusCreate) => api.create(input),
  update: (id: string, input: SyllabusUpdate) => api.update(id, input),
  delete: api.delete,
}
