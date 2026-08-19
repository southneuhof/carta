import { defineSchema } from '@southneuhof/is-vue-framework'
import type { WebResourceSchema } from '@southneuhof/is-vue-framework'

export type ProjectRoleCoverage = { coverageType: 'all_projects' } | { coverageType: 'division'; divisionId: string } | { coverageType: 'project'; projectId: string }

export type ProjectRoleAssignmentOptions = {
  divisions: { id: string; name: string; active: boolean }[]
  projects: { id: string; divisionId: string; number: string; name: string; active: boolean }[]
}

export type ProjectRoleAssignmentSource = {
  coverageType: ProjectRoleCoverage['coverageType']
  divisionId: string | null
  projectId: string | null
  divisionName?: string
  label: string
}

export type ProjectRoleAssignment = {
  id: string
  roleCode: string
  name: string
  description: string | null
  active: boolean
  direct: boolean
  effective: boolean
  locked: boolean
  source: ProjectRoleAssignmentSource | null
}

export type ProjectRoleAssignmentQuery = {
  coverageType?: ProjectRoleCoverage['coverageType']
  divisionId?: string
  projectId?: string
}

export type ProjectRoleAssignmentSchema = WebResourceSchema<ProjectRoleAssignment, ProjectRoleAssignmentQuery, Record<string, never>, Record<string, never>, string>

export const projectRoleAssignmentsSchema = defineSchema<ProjectRoleAssignmentSchema>({ identity: 'id' })
