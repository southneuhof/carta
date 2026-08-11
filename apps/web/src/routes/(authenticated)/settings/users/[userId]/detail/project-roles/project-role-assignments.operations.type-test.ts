import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'
import type { ProjectRoleCoverage } from './project-role-assignments.operations'

type OptionsEndpoint = (typeof rpc.users)[':userId']['project-role-assignment-options']['$get']
type ListEndpoint = (typeof rpc.users)[':userId']['project-role-assignments']['$get']
type PutEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$put']
type DeleteEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$delete']

type Options = HonoResponseOf<OptionsEndpoint, 200>['data']
type Assignment = HonoResponseOf<ListEndpoint, 200>['data'][number]
type PutResult = HonoResponseOf<PutEndpoint, 200>['data']
type DeleteResult = HonoResponseOf<DeleteEndpoint, 200>['data']
type PutRequest = HonoRequestOf<PutEndpoint>
type DeleteRequest = HonoRequestOf<DeleteEndpoint>

type Same<TLeft, TRight> = [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false
const sameMutationResult: Same<PutResult, DeleteResult> = true

const options: Options = { divisions: [{ id: 'division-1', name: 'Division 1', active: true }], projects: [{ id: 'project-1', divisionId: 'division-1', number: 'P-1', name: 'Project 1', active: true }] }
const row: Assignment = {
  id: 'role-1',
  roleCode: 'project-admin',
  name: 'Project Administrator',
  description: null,
  active: true,
  direct: true,
  effective: true,
  locked: false,
  source: null,
}
const coverages: ProjectRoleCoverage[] = [
  { coverageType: 'all_projects' },
  { coverageType: 'division', divisionId: 'division-1' },
  { coverageType: 'project', projectId: 'project-1' },
]
const putRequest: PutRequest = { param: { userId: 'user-1', roleId: 'role-1' }, json: coverages[1] }
const deleteRequest: DeleteRequest = { param: { userId: 'user-1', roleId: 'role-1' }, json: coverages[2] }
const mutation: PutResult = [row]
void [options, putRequest, deleteRequest, mutation, sameMutationResult]
