import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'
import { notificationOperations } from './notifications.operations'

type IsUnknown<T> = unknown extends T ? ([keyof T] extends [never] ? true : false) : false
type HasOperation<TKey extends string> = TKey extends keyof typeof notificationOperations ? true : false
type ListResponse = HonoResponseOf<(typeof rpc.notifications)['list']['$get'], 200>
type MarkSeenRequest = HonoRequestOf<(typeof rpc.notifications)['mark-seen']['$post']>
const listRowIsKnown: IsUnknown<ListResponse['data'][number]> = false
const operations: [HasOperation<'list'>, HasOperation<'create'>, HasOperation<'update'>, HasOperation<'delete'>] = [true, false, false, false]
const markSeen: MarkSeenRequest = { json: { ids: ['notification-1'] } }
// @ts-expect-error mark-seen accepts an array of ids, not one id.
const invalidMarkSeen: MarkSeenRequest = { json: { ids: 'notification-1' } }
// @ts-expect-error notifications has no create operation.
const create = notificationOperations.create
// @ts-expect-error notifications has no update operation.
const update = notificationOperations.update
// @ts-expect-error notifications has no delete operation.
const remove = notificationOperations.delete
void [listRowIsKnown, operations, markSeen, invalidMarkSeen, create, update, remove]
