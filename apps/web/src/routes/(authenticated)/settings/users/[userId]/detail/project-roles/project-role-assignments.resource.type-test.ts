import { projectRoleAssignments } from './project-role-assignments.resource'
import type { ProjectRoleAssignment, ProjectRoleAssignmentOptions, ProjectRoleCoverage } from './project-role-assignments.schema'

const row: ProjectRoleAssignment = {
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
const options: ProjectRoleAssignmentOptions = { divisions: [{ id: 'division-1', name: 'Division 1', active: true }], projects: [{ id: 'project-1', divisionId: 'division-1', number: 'P-1', name: 'Project 1', active: true }] }
const coverages: ProjectRoleCoverage[] = [
  { coverageType: 'all_projects' },
  { coverageType: 'division', divisionId: 'division-1' },
  { coverageType: 'project', projectId: 'project-1' },
]
const list = projectRoleAssignments.list({ searchParameters: { userId: 'user-1', ...coverages[0] } })
const optionAction = projectRoleAssignments.actions.options.run('user-1')
const setAction = projectRoleAssignments.actions.set.run('user-1', 'role-1', coverages[1], true)
void [row, options, list, optionAction, setAction]
