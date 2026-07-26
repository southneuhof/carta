import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { rpc } from '@/framework/rpc'
import { createRpcOperations } from './rpcResource'
import { roles, type Role } from './roles'
import type { RpcCRUDRoute } from './rpcRoute'

export interface User extends Record<string, unknown> {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UserQuery extends Record<string, unknown> {
  page?: number
  limit?: number
  search?: string
}

export interface UserDraft extends Record<string, unknown> {
  name: string
  email: string
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
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
  updatedAt: { label: 'Diubah', display: { format: 'datetime' }, form: false },
})

/**
 * The users API exposes list, detail, and update only. Create and delete are
 * therefore absent from the derived capabilities, and their standard controls
 * disappear on their own — no `create: false` configuration needed.
 *
 * A user has no single role: roles are a many-to-many assignment managed through
 * the dedicated screen below, not a field on the record.
 */
export const users = defineResource<User, UserQuery, UserDraft, UserDraft>({
  key: 'users',
  fields: userFields,
  operations: createRpcOperations<User, UserQuery, UserDraft, UserDraft>(rpc.users as unknown as RpcCRUDRoute),
  table: { fields: ['name', 'email', 'createdAt', 'updatedAt'] },
  detail: { fields: ['name', 'email', 'createdAt', 'updatedAt'] },
  form: { fields: ['name', 'email'] },
  // The authoritative server schemas, imported from the entity module itself —
  // not a browser-side re-declaration that has to be kept in step with it.
  schemas: {
    create: fromZod<UserDraft>(user.schemas.create),
    update: fromZod<UserDraft>(user.schemas.update),
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
 * the roles resource plus the user's current assignments — not a fabricated CRUD
 * resource with unavailable operations.
 *
 * Assignment is many-to-many, so this reads the user's role list rather than a
 * single `roleId` off the user record.
 */
export async function loadAssignableRoles(userId: string): Promise<{ data: AssignableRole[] }> {
  const [roleResult, assignedResponse] = await Promise.all([roles.table().load!({ query: { limit: 100 }, searchParameters: {} }), rpc.users[':userId'].roles.$get({ param: { userId } })])

  const assignments = assignedResponse.ok ? ((await assignedResponse.json()) as { data?: { id: string; assigned: boolean }[] }).data : undefined
  const assigned = new Set((assignments ?? []).filter((entry) => entry.assigned).map((entry) => entry.id))

  return {
    data: (roleResult as { data: Role[] }).data.map((role) => ({
      id: role.id,
      name: role.name,
      active: assigned.has(role.id),
    })),
  }
}

/** Assigns or revokes one role for a user; the caller owns optimistic state. */
export async function setUserRole(userId: string, roleId: string, active: boolean): Promise<void> {
  const route = rpc.users[':userId'].roles[':roleId']
  const request = { param: { userId, roleId } }
  const response = active ? await route.$put(request) : await route.$delete(request)
  if (!response.ok) throw await response.json().catch(() => new Error('Role assignment request failed'))
}
