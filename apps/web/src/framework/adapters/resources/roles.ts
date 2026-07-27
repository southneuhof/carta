import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import { rpc } from '@/framework/rpc'
import { createRpcOperations } from './rpcResource'
import type { RpcCRUDRoute } from './rpcRoute'

export interface Role extends Record<string, unknown> {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface RoleQuery extends Record<string, unknown> {
  page?: number
  limit?: number
  search?: string
}

export interface RoleDraft extends Record<string, unknown> {
  name: string
}

export const roleFields = defineFields<Role, RoleDraft>()({
  name: {
    label: 'Nama Role',
    table: { sortable: true },
    form: { renderer: 'text' },
  },
  createdAt: {
    label: 'Dibuat',
    display: { format: 'datetime' },
    form: false,
  },
})

/**
 * Ordinary list, detail, create, update, and delete behavior is derived from
 * the RPC route; only route targets and field presentation are declared here.
 */
export const roles = defineResource<Role, RoleQuery, RoleDraft, RoleDraft>({
  key: 'roles',
  fields: roleFields,
  operations: createRpcOperations<Role, RoleQuery, RoleDraft, RoleDraft>(rpc.roles as unknown as RpcCRUDRoute),
  table: { fields: ['name', 'createdAt'] },
  detail: { fields: ['name', 'createdAt'] },
  form: { fields: ['name'] },
  // The authoritative server schemas, imported from the entity module itself —
  // not a browser-side re-declaration that has to be kept in step with it.
  schemas: {
    create: fromZod<RoleDraft>(role.schemas.create),
    update: fromZod<RoleDraft>(role.schemas.update),
  },
  actions: {
    list: { permission: 'roles.list', to: { name: 'settings-roles' } },
    create: { permission: 'roles.create', to: { name: 'settings-roles-new' } },
    detail: { permission: 'roles.detail', to: { name: 'settings-roles-detail', params: (id) => ({ roleId: id }) } },
    update: { permission: 'roles.update', to: { name: 'settings-roles-edit', params: (id) => ({ roleId: id }) } },
    delete: { permission: 'roles.delete' },
  },
})

export interface RolePermission extends Record<string, unknown> {
  id: string
  name: string
  assigned: boolean
}

export const rolePermissionFields = defineFields<RolePermission>()({
  name: { label: 'Permission' },
})

/**
 * Permissions under a role are an ordinary collection scoped by an ordinary
 * `searchParameters` entry — the route supplies `role_id`. Toggling a
 * permission is an extraordinary workflow and stays explicit code below.
 */
export const rolePermissions = defineResource<RolePermission>({
  key: 'role-permissions',
  fields: rolePermissionFields,
  operations: {
    list: async ({ searchParameters }) => {
      const roleId = String(searchParameters.role_id ?? '')
      if (!roleId) return { data: [] }
      const response = await rpc.roles[':roleId'].permissions.$get({ param: { roleId } })
      if (!response.ok) throw await response.json()
      const payload = (await response.json()) as { data: RolePermission[]; total?: number }
      return { data: payload.data, meta: { total: payload.total } }
    },
  },
  actions: {
    list: { permission: 'roles.update', to: { name: 'settings-roles-detail-permissions' } },
  },
})

/** Assigns or removes one permission; the caller owns optimistic state. */
export async function setRolePermission(roleId: string, permissionId: string, assigned: boolean): Promise<void> {
  const route = rpc.roles[':roleId'].permissions[':permissionId']
  const request = { param: { roleId, permissionId } }
  const response = assigned ? await route.$put(request) : await route.$delete(request)
  if (!response.ok) throw await response.json().catch(() => new Error('Permission toggle request failed'))
}
