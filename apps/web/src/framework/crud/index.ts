import type { CRUDOperations } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { createCreateOperation } from './create'
import { createDeleteOperation } from './delete'
import { createDetailOperation } from './detail'
import { createListOperation } from './list'
import { createUpdateOperation } from './update'
import type { RpcCRUDResource } from './types'

export function createRpcCRUDOperations(resource: RpcCRUDResource): CRUDOperations {
  return {
    list: createListOperation(resource),
    detail: createDetailOperation(resource),
    create: createCreateOperation(resource),
    update: createUpdateOperation(resource),
    delete: createDeleteOperation(resource),
  }
}

export type { RpcCRUDResource } from './types'
