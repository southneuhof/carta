import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { projectRoleAssignmentsActions } from './project-role-assignments.actions'
import { projectRoleAssignmentsSchema } from './project-role-assignments.schema'

const fields = defineFields(projectRoleAssignmentsSchema, {
  roleCode: { label: 'Code' },
  name: { label: 'Name' },
  description: { label: 'Description' },
  active: { label: 'Active' },
  direct: { label: 'Direct' },
  effective: { label: 'Assigned', table: { align: 'center' } },
  locked: { label: 'Locked' },
  source: { label: 'Source' },
})

export const projectRoleAssignments = defineResource(projectRoleAssignmentsSchema, {
  key: 'project-role-assignments',
  actions: {
    list: {
      run: projectRoleAssignmentsActions.list,
      fields: [fields.roleCode, fields.name, fields.description, fields.active, fields.direct, fields.effective, fields.locked, fields.source],
      permission: 'view-project-role-assignments',
      route: { name: 'settings-users-detail-project-roles' },
    },
    options: { run: projectRoleAssignmentsActions.options },
    set: { run: projectRoleAssignmentsActions.set },
  },
})
