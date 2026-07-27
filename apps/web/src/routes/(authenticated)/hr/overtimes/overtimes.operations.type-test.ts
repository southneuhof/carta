import type { ResourceCreateOf } from '@southneuhof/is-vue-framework'
import type { HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'
import { overtimeOperations } from './overtimes.operations'

type IsUnknown<T> = unknown extends T ? ([keyof T] extends [never] ? true : false) : false
type HasOperation<TKey extends string> = TKey extends keyof typeof overtimeOperations ? true : false
type ListResponse = HonoResponseOf<(typeof rpc.overtimes)['list']['$get'], 200>
type DetailResponse = HonoResponseOf<(typeof rpc.overtimes)['detail'][':id']['$get'], 200>
type OvertimeCreate = ResourceCreateOf<typeof overtimeOperations>
const listRowIsKnown: IsUnknown<ListResponse['data'][number]> = false
const detailIsKnown: IsUnknown<DetailResponse['data']> = false
const operations: [HasOperation<'list'>, HasOperation<'detail'>, HasOperation<'create'>, HasOperation<'update'>, HasOperation<'delete'>] = [true, true, true, true, false]
const request: OvertimeCreate = { date: '2026-07-27', startTime: '08:00', estimatedMinutes: 60, applicantEmployeeId: 'employee-1', sectionId: 'section-1', statusCode: 'draft' }
const draft = { date: request.date, startTime: request.startTime, estimatedMinutes: request.estimatedMinutes, description: request.description }
// @ts-expect-error status is server-derived and not part of an authorable draft.
draft.statusCode
// @ts-expect-error status literals come from the exact API record.
const invalidStatus: ListResponse['data'][number]['statusCode'] = 'cancelled'
// @ts-expect-error overtimes has no delete operation.
const remove = overtimeOperations.delete
void [listRowIsKnown, detailIsKnown, operations, request, draft, invalidStatus, remove]
