import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadSystemRoleAssignments, type SystemRoleAssignment } from './system-role-assignments.operations'

export const systemRoleAssignmentFields = defineFields<SystemRoleAssignment>()({
  roleCode: { label: 'Code' },
  name: { label: 'Name' },
  description: { label: 'Description' },
  active: { label: 'Active' },
  assigned: { label: 'Assigned' },
})

export const systemRoleAssignments = defineResource({
  key: 'system-role-assignments',
  fields: systemRoleAssignmentFields,
  capabilities: {
    list: {
      handler: ({ searchParameters }) => loadSystemRoleAssignments(String(searchParameters.userId ?? '')),
      permission: 'view-system-role-assignments',
      to: { name: 'settings-users-detail-system-roles' },
    },
  },
})
