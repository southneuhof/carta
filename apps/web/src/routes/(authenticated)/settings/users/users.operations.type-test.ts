import type { ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { userOperations } from './users.operations'

type HasOperation<TKey extends string> = TKey extends keyof typeof userOperations ? true : false
type UserUpdate = ResourceUpdateOf<typeof userOperations>

const operations: [HasOperation<'list'>, HasOperation<'detail'>, HasOperation<'update'>, HasOperation<'create'>, HasOperation<'delete'>] = [true, true, true, false, false]
const update: UserUpdate = { name: 'Nama baru', username: 'nama-baru', statusCode: 'active' }
// @ts-expect-error email is deliberately read-only in the update contract.
const emailUpdate: UserUpdate = { email: 'new@example.test' }
// @ts-expect-error users has no delete operation.
const remove = userOperations.delete
void [operations, update, emailUpdate, remove]
