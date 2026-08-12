import type { CollectionLoadContext, CollectionResult } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import type { Permission, PermissionRecord } from './permissions.schema'

const permissionTransport = createHonoResourceActions(rpc.permissions, dataAdapter)
const moduleTransport = createHonoResourceActions(rpc.modules, dataAdapter)

async function withModule(record: PermissionRecord): Promise<Permission> {
  const module = await moduleTransport.detail({ id: record.moduleId, searchParameters: {} })
  if (!module) throw new Error('Permission module not found.')
  return { ...record, module }
}

export const permissionsActions = {
  list: async (context: CollectionLoadContext<Record<string, unknown>>): Promise<CollectionResult<Permission>> => {
    const result = await permissionTransport.list(context as Parameters<typeof permissionTransport.list>[0])
    return { ...result, data: await Promise.all(result.data.map(withModule)) }
  },
  detail: async (context: Parameters<typeof permissionTransport.detail>[0]): Promise<Permission | undefined> => {
    const record = await permissionTransport.detail(context)
    return record ? withModule(record) : record
  },
}
