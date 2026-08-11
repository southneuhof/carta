import { parseHonoResponse, type HonoRequestOf, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

type OptionsEndpoint = (typeof rpc.users)[':userId']['project-role-assignment-options']['$get']
type ListEndpoint = (typeof rpc.users)[':userId']['project-role-assignments']['$get']
type PutEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$put']
type DeleteEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$delete']
type OptionsResponse = HonoResponseOf<OptionsEndpoint, 200>
type ListResponse = HonoResponseOf<ListEndpoint, 200>
type PutRequest = HonoRequestOf<PutEndpoint>
type DeleteRequest = HonoRequestOf<DeleteEndpoint>
type ListRequest = HonoRequestOf<ListEndpoint>
type PutResponse = HonoResponseOf<PutEndpoint, 200>
type DeleteResponse = HonoResponseOf<DeleteEndpoint, 200>
type PutCoverage = PutRequest['json']
type DeleteCoverage = DeleteRequest['json']

type Same<TLeft, TRight> = [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false
const sameCoverageContract: Same<PutCoverage, DeleteCoverage> = true
const sameMutationResult: Same<PutResponse['data'], DeleteResponse['data']> = true
void [sameCoverageContract, sameMutationResult]

export type ProjectRoleAssignmentOptions = OptionsResponse['data']
export type ProjectRoleAssignment = ListResponse['data'][number]
export type ProjectRoleCoverage = PutCoverage
export type ProjectRoleAssignmentMutationResult = PutResponse['data']

export async function loadProjectRoleAssignmentOptions(userId: string): Promise<ProjectRoleAssignmentOptions> {
  if (!userId) return { divisions: [], projects: [] }
  return (await parseHonoResponse<OptionsEndpoint>(await rpc.users[':userId']['project-role-assignment-options'].$get({ param: { userId } }))).data
}

function queryForCoverage(coverage: ProjectRoleCoverage): NonNullable<ListRequest['query']> {
  if (coverage.coverageType === 'division') return { coverageType: coverage.coverageType, divisionId: coverage.divisionId }
  if (coverage.coverageType === 'project') return { coverageType: coverage.coverageType, projectId: coverage.projectId }
  return { coverageType: coverage.coverageType }
}

export async function loadProjectRoleAssignments(userId: string, coverage: ProjectRoleCoverage): Promise<CollectionResult<ProjectRoleAssignment>> {
  if (!userId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.users[':userId']['project-role-assignments'].$get({
    param: { userId },
    query: queryForCoverage(coverage),
  }))
  return { data: payload.data, meta: { total: payload.total } }
}

export async function setProjectRoleAssignment(userId: string, roleId: string, coverage: ProjectRoleCoverage, assigned: boolean): Promise<ProjectRoleAssignmentMutationResult> {
  const route = rpc.users[':userId']['project-role-assignments'][':roleId']
  const request = { param: { userId, roleId }, json: coverage }
  if (assigned) return (await parseHonoResponse<PutEndpoint>(await route.$put(request))).data
  return (await parseHonoResponse<DeleteEndpoint>(await route.$delete(request))).data
}
