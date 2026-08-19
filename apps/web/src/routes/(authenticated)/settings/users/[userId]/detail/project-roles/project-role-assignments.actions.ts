import type { CollectionLoadContext, CollectionResult } from '@southneuhof/is-vue-framework'
import { parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { ProjectRoleAssignment, ProjectRoleAssignmentOptions, ProjectRoleAssignmentQuery, ProjectRoleCoverage } from './project-role-assignments.schema'

type OptionsEndpoint = (typeof rpc.users)[':userId']['project-role-assignment-options']['$get']
type ListEndpoint = (typeof rpc.users)[':userId']['project-role-assignments']['$get']
type PutEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$put']
type DeleteEndpoint = (typeof rpc.users)[':userId']['project-role-assignments'][':roleId']['$delete']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
type MutationResult = HonoResponseOf<PutEndpoint, 200>['data']
type DeleteResult = HonoResponseOf<DeleteEndpoint, 200>['data']

type Same<TLeft, TRight> = [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false
const sameMutationResult: Same<MutationResult, DeleteResult> = true
void sameMutationResult

export function coverageFromSearchParameters(searchParameters: Record<string, unknown>): ProjectRoleCoverage {
  if (searchParameters.coverageType === 'division' && typeof searchParameters.divisionId === 'string') {
    return { coverageType: 'division', divisionId: searchParameters.divisionId }
  }
  if (searchParameters.coverageType === 'project' && typeof searchParameters.projectId === 'string') {
    return { coverageType: 'project', projectId: searchParameters.projectId }
  }
  return { coverageType: 'all_projects' }
}

export function queryForCoverage(coverage: ProjectRoleCoverage) {
  if (coverage.coverageType === 'division') return { coverageType: coverage.coverageType, divisionId: coverage.divisionId }
  if (coverage.coverageType === 'project') return { coverageType: coverage.coverageType, projectId: coverage.projectId }
  return { coverageType: coverage.coverageType }
}

async function options(userId: string): Promise<ProjectRoleAssignmentOptions> {
  if (!userId) return { divisions: [], projects: [] }
  return (await parseHonoResponse<OptionsEndpoint>(await rpc.users[':userId']['project-role-assignment-options'].$get({ param: { userId } }))).data as ProjectRoleAssignmentOptions
}

async function list({ searchParameters }: CollectionLoadContext<ProjectRoleAssignmentQuery>): Promise<CollectionResult<ProjectRoleAssignment>> {
  const userId = String(searchParameters.userId ?? '')
  if (!userId) return { data: [] }
  const coverage = coverageFromSearchParameters(searchParameters)
  const payload = await parseHonoResponse<ListEndpoint>(
    await rpc.users[':userId']['project-role-assignments'].$get({
      param: { userId },
      query: queryForCoverage(coverage),
    })
  )
  return { data: payload.data as ListResponse['data'] as ProjectRoleAssignment[], meta: { total: payload.total } }
}

async function set(userId: string, roleId: string, coverage: ProjectRoleCoverage, assigned: boolean): Promise<ProjectRoleAssignment[]> {
  const route = rpc.users[':userId']['project-role-assignments'][':roleId']
  const request = { param: { userId, roleId }, json: coverage }
  if (assigned) return (await parseHonoResponse<typeof route.$put>(await route.$put(request))).data as ProjectRoleAssignment[]
  return (await parseHonoResponse<typeof route.$delete>(await route.$delete(request))).data as ProjectRoleAssignment[]
}

export const projectRoleAssignmentsActions = { options, list, set }
