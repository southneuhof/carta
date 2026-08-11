import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import { z } from 'zod/v4'
import { roleOperations, type Role, type RoleCreate, type RoleUpdate } from './roles.operations'

const realmOptions = [
  { id: 'system', name: 'System' },
  { id: 'project', name: 'Project' },
] as const

const realmLabel = (value: unknown) => value === 'system' ? 'System' : value === 'project' ? 'Project' : value
const roleUpdateSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'realm'))
}, role.schemas.update)

export const roleFields = defineFields<Role, RoleCreate>()({
  roleCode: { label: 'Role Code', form: { renderer: 'text' } },
  name: { label: 'Role Name', form: { renderer: 'text' } },
  description: { label: 'Description', form: { renderer: 'textarea' } },
  realm: {
    label: 'Realm',
    read: (record) => realmLabel(record.realm),
    form: {
      renderer: 'radio',
      source: realmOptions,
      props: { required: true },
      behavior: { disabled: ({ context }) => context.operation === 'update' },
    },
  },
  active: { label: 'Active' },
  createdAt: { label: 'Created At' },
})

const roleCapabilities = {
  list: { handler: roleOperations.list, permission: 'view-roles', to: { name: 'settings-roles' } },
  create: { handler: roleOperations.create, permission: 'manage-roles', to: { name: 'settings-roles-create' } },
  detail: { handler: roleOperations.detail, permission: 'view-roles', to: { name: 'settings-roles-detail', params: (id: string) => ({ roleId: id }) } },
  update: { handler: roleOperations.update, permission: 'manage-roles', to: { name: 'settings-roles-edit', params: (id: string) => ({ roleId: id }) } },
  delete: { handler: roleOperations.delete, permission: 'manage-roles' },
} as const

export const roles = defineResource<typeof roleCapabilities, Role, Record<string, never>, RoleCreate, RoleUpdate>({
  key: 'roles',
  fields: roleFields,
  table: { fields: ['roleCode', 'name', 'realm', 'active'] },
  detail: { fields: ['roleCode', 'name', 'description', 'realm', 'active', 'createdAt'] },
  form: { fields: ['roleCode', 'name', 'description', 'realm', 'active'] },
  schemas: { create: fromZod<RoleCreate>(role.schemas.create), update: fromZod<RoleUpdate>(roleUpdateSchema) },
  capabilities: roleCapabilities,
})

export type { Role, RoleCreate, RoleUpdate }
