import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { authorizationModule, permission } from '@southneuhof/api/routes/roles/roles.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

type PermissionRecord = z.output<typeof permission.schemas.select>
type Module = z.output<typeof authorizationModule.schemas.select>
export type Permission = PermissionRecord & {
  module: Pick<Module, 'id' | 'code' | 'name' | 'realm' | 'active'>
}

const permissionTransport = createHonoResourceOperations(rpc.permissions, dataAdapter)
const moduleTransport = createHonoResourceOperations(rpc.modules, dataAdapter)

async function withModule(record: PermissionRecord): Promise<Permission> {
  const module = await moduleTransport.detail({ id: record.moduleId, searchParameters: {} })
  if (!module) throw new Error('Permission module not found.')
  return { ...record, module }
}

export const permissionOperations = defineResourceOperations<Permission>()({
  list: async (context) => {
    const result = await permissionTransport.list(context)
    return { ...result, data: await Promise.all(result.data.map(withModule)) }
  },
  detail: async (context) => {
    const record = await permissionTransport.detail(context)
    return record ? withModule(record) : record
  },
})
