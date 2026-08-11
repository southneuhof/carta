import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import {
  loadProjectRoleAssignments,
  type ProjectRoleAssignment,
  type ProjectRoleCoverage,
} from './project-role-assignments.operations'

export const projectRoleAssignmentFields = defineFields<ProjectRoleAssignment>()({
  roleCode: { label: 'Code' },
  name: { label: 'Name' },
  description: { label: 'Description' },
  active: { label: 'Active' },
  direct: { label: 'Direct' },
  effective: { label: 'Assigned', table: { align: 'center' } },
  locked: { label: 'Locked' },
  source: { label: 'Source' },
})

function coverageFromSearchParameters(searchParameters: Record<string, unknown>): ProjectRoleCoverage {
  if (searchParameters.coverageType === 'division' && typeof searchParameters.divisionId === 'string') {
    return { coverageType: 'division', divisionId: searchParameters.divisionId }
  }
  if (searchParameters.coverageType === 'project' && typeof searchParameters.projectId === 'string') {
    return { coverageType: 'project', projectId: searchParameters.projectId }
  }
  return { coverageType: 'all_projects' }
}

export const projectRoleAssignments = defineResource({
  key: 'project-role-assignments',
  fields: projectRoleAssignmentFields,
  table: { fields: ['roleCode', 'name', 'description', 'active', 'effective'] },
  capabilities: {
    list: {
      handler: ({ searchParameters }) => loadProjectRoleAssignments(
        String(searchParameters.userId ?? ''),
        coverageFromSearchParameters(searchParameters),
      ),
      permission: 'view-project-role-assignments',
      to: { name: 'settings-users-detail-project-roles' },
    },
  },
})
