import type { HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { ResourceCreateOf, ResourceRecordOf, ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { roleOperations } from './roles.operations'

type HasList = 'list' extends keyof typeof rpc.roles ? true : false
type HasOperation<TKey extends string> = TKey extends keyof typeof roleOperations ? true : false
type ListResponse = HonoResponseOf<(typeof rpc.roles)['list']['$get'], 200>
type Role = ResourceRecordOf<typeof roleOperations>
type RoleCreate = ResourceCreateOf<typeof roleOperations>
type RoleUpdate = ResourceUpdateOf<typeof roleOperations>
const hasList: HasList = true
const hasOperations: [HasOperation<'list'>, HasOperation<'detail'>, HasOperation<'create'>, HasOperation<'update'>, HasOperation<'delete'>] = [true, true, true, true, true]
const list: ListResponse = { data: [{ id: 'r1', roleCode: 'admin', name: 'Admin', description: null, realm: 'system', active: true, createdByUserId: null, updatedByUserId: null, createdAt: '', updatedAt: '' }], page: 1, limit: 10, total: 1 }
const role: Role = list.data[0]
const create: RoleCreate = { roleCode: 'editor', name: 'Editor', realm: 'system' }
const update: RoleUpdate = { name: 'Editor' }
const projectRealm: RoleCreate = { roleCode: 'editor', name: 'Editor', realm: 'project' }
void [hasList, hasOperations, list, role, create, update, projectRealm]
