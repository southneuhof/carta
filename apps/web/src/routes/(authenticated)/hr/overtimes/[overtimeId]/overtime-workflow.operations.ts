import { parseHonoResponse } from '@southneuhof/is-vue-framework/hono'
import { overtimeOperations, type Overtime } from '../overtimes.operations'
import { rpc } from '@/framework/rpc'

export async function loadOvertime(id: string): Promise<Overtime> {
  const record = await overtimeOperations.detail({ id, searchParameters: {} })
  if (!record) throw new Error(`Overtime ${id} not found`)
  return record
}
export async function submitOvertime(id: string): Promise<void> {
  await parseHonoResponse<(typeof rpc.overtimes)['submit'][':id']['$post']>(await rpc.overtimes.submit[':id'].$post({ param: { id } }))
}
export async function verifyOvertime(id: string, decision: 'approved' | 'rejected', description?: string): Promise<void> {
  await parseHonoResponse<(typeof rpc.overtimes)['verify'][':id']['$post']>(await rpc.overtimes.verify[':id'].$post({ param: { id }, json: { decision, description } }))
}
