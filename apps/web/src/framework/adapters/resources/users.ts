import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { userSchemas } from '@southneuhof/contracts'
import { rpc } from '@/framework/rpc'
import services from '@/utils/services'
import { createRpcOperations } from './rpcResource'
import { roles, type Role } from './roles'
import type { RpcCRUDRoute } from '../crud/common'

export interface User extends Record<string, unknown> {
  id: string
  name: string
  email: string
  roleId: string
  role?: Role
  createdAt: string
  updatedAt: string
}

export interface UserQuery extends Record<string, unknown> {
  page?: number
  limit?: number
  search?: string
  roleId?: string
}

export interface UserDraft extends Record<string, unknown> {
  name: string
  email: string
  roleId: string
}

export const userFields = defineFields<User, UserDraft>()({
  name: {
    label: 'Nama',
    table: { sortable: true },
    form: { renderer: 'text' },
  },
  email: {
    label: 'Email',
    table: { sortable: true },
    form: { renderer: 'text' },
  },
  roleId: {
    label: 'Role',
    // The list shows the joined role name; the draft still writes the identity.
    read: (record) => (record.role as Role | undefined)?.name ?? record.roleId,
    form: { renderer: 'text' },
  },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
  updatedAt: { label: 'Diubah', display: { format: 'datetime' }, form: false },
})

/**
 * The users API exposes list, detail, and update only. Create and delete are
 * therefore absent from the derived capabilities, and their standard controls
 * disappear on their own — no `create: false` configuration needed.
 */
export const users = defineResource<User, UserQuery, UserDraft, UserDraft>({
  key: 'users',
  fields: userFields,
  operations: createRpcOperations<User, UserQuery, UserDraft, UserDraft>(rpc.users as unknown as RpcCRUDRoute),
  table: { fields: ['name', 'email', 'roleId', 'createdAt', 'updatedAt'] },
  detail: { fields: ['name', 'email', 'roleId', 'createdAt', 'updatedAt'] },
  form: { fields: ['name', 'email', 'roleId'] },
  schemas: {
    create: fromZod<UserDraft>(userSchemas.create),
    update: fromZod<UserDraft>(userSchemas.update),
  },
  routes: {
    list: '/settings/users',
    detail: (id) => `/settings/users/${id}`,
    update: (id) => `/settings/users/${id}/edit`,
  },
})

export interface AssignableRole extends Record<string, unknown> {
  id: string
  name: string
  active: boolean
}

/**
 * Roles offered for one user. This is an ordinary collection load composed from
 * the roles resource plus the user's current assignment — not a fabricated CRUD
 * resource with unavailable operations.
 */
export async function loadAssignableRoles(userId: string): Promise<{ data: AssignableRole[] }> {
  const [roleResult, userResponse] = await Promise.all([roles.table().load!({ query: { limit: 100 }, searchParameters: {} }), rpc.users.detail[':id'].$get({ param: { id: userId } })])

  const assigned = userResponse.ok ? ((await userResponse.json()) as { data?: User }).data?.roleId : undefined

  return {
    data: (roleResult as { data: Role[] }).data.map((role) => ({
      id: role.id,
      name: role.name,
      active: role.id === assigned,
    })),
  }
}

/** Assigns or clears one role for a user; the caller owns optimistic state. */
export async function setUserRole(userId: string, roleId: string, active: boolean): Promise<void> {
  await services.post('mapping-user-roles/toggle', { user_id: userId, role_id: roleId, active })
}
