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
void [listRowIsKnown, operations, markSeen]
