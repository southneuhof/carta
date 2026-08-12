import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { systemRoleAssignmentsActions } from './system-role-assignments.actions'
import { systemRoleAssignmentsSchema } from './system-role-assignments.schema'

const fields = defineFields(systemRoleAssignmentsSchema, {
  roleCode: { label: 'Code' },
  name: { label: 'Name' },
  description: { label: 'Description' },
  active: { label: 'Active' },
  assigned: { label: 'Assigned' },
})

export const systemRoleAssignments = defineResource(systemRoleAssignmentsSchema, {
  key: 'system-role-assignments',
  actions: {
    list: {
      run: systemRoleAssignmentsActions.list,
      fields: [fields.roleCode, fields.name, fields.description, fields.active, fields.assigned],
      permission: 'view-system-role-assignments',
      route: { name: 'settings-users-detail-system-roles' },
    },
    set: { run: systemRoleAssignmentsActions.set },
  },
})
