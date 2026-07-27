import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { z } from 'zod'
import { defineResource, resourceActionForRoute, resetResourceActionRegistry } from '../defineResource'
import { registerResourceRuntime, resetResourceRuntimeForTests } from '../runtime'
import { resolveFrameworkAdapters } from '../../adapters/projectAdapters'
import { createFrameworkQueryClient } from '../../query/client'
import { fromZod } from '../../validation'
import { flush, mountCore } from '../../components/core/__tests__/harness'
import ListView from '../../components/views/ListView.vue'
import FormView from '../../components/views/FormView.vue'
import Table from '../../components/core/Table.vue'
import type { AccessAdapter } from '../../contracts'

interface Role extends Record<string, unknown> {
  id: string
  name: string
}

const fields = { id: { label: 'ID' }, name: { label: 'Nama' } }
const records: Role[] = [{ id: '1', name: 'Admin' }]

/** Ordinary resource: data behavior plus explicit actions. */
function ordinaryResource(spies: Record<string, ReturnType<typeof vi.fn>> = {}) {
  return defineResource<Role>({
    key: 'roles',
    fields,
    operations: {
      list: spies.list ?? (async () => ({ data: records, meta: { total: 1, pageSize: 10, totalPage: 1 } })),
      detail: spies.detail ?? (async ({ id }) => records.find((role) => role.id === String(id))),
      create: spies.create ?? (async (input) => ({ id: '2', ...input })),
      update: spies.update ?? (async (id, input) => ({ id, ...input })),
      delete: spies.delete ?? (async () => undefined),
    },
    actions: {
      list: { permission: 'roles.list', to: { name: 'roles-list' } },
      create: { permission: 'roles.create', to: { name: 'test-route' } },
      detail: { permission: 'roles.detail', to: { name: 'roles-detail', params: (id) => ({ id }) } },
      update: { permission: 'roles.update', to: { name: 'roles-edit', params: (id) => ({ id }) } },
      delete: { permission: 'roles.delete' },
    },
  })
}

afterEach(() => {
  resetResourceRuntimeForTests()
  resetResourceActionRegistry()
})

describe('defineResource factories', () => {
  it('normalizes action targets and registers named routes', () => {
    const roles = ordinaryResource()

    expect(roles.actions.list).toMatchObject({ key: 'list', permission: 'roles.list', routeName: 'roles-list', to: { name: 'roles-list' } })
    const detailTarget = roles.actions.detail?.to
    expect(typeof detailTarget).toBe('function')
    expect((detailTarget as (id: string) => unknown)('7')).toEqual({ name: 'roles-detail', params: { id: '7' } })
    expect(resourceActionForRoute('roles-detail')).toMatchObject({ resourceKey: 'roles', action: 'detail', permission: 'roles.detail' })
    expect(resourceActionForRoute('roles-delete')).toBeUndefined()
  })

  it('allows identical HMR-style registration and rejects conflicting action owners', () => {
    ordinaryResource()
    expect(() => ordinaryResource()).not.toThrow()
    expect(() => defineResource({
      key: 'other-roles',
      fields,
      actions: { list: { permission: 'other-roles.list', to: { name: 'roles-list' } } },
    })).toThrow('roles.list')
  })

  it('resets registered actions between tests', () => {
    ordinaryResource()
    expect(resourceActionForRoute('roles-list')).toBeDefined()
    resetResourceActionRegistry()
    expect(resourceActionForRoute('roles-list')).toBeUndefined()
  })

  it('keeps public and targetless delete actions explicit', () => {
    const publicFeed = defineResource({
      key: 'feed',
      fields: { id: { label: 'ID' } },
      actions: { list: { permission: null, to: { name: 'feed' } }, delete: { permission: null } },
    })

    expect(publicFeed.actions.list).toMatchObject({ permission: null, routeName: 'feed' })
    expect(publicFeed.actions.delete).toMatchObject({ permission: null })
    expect(publicFeed.actions.delete?.to).toBeUndefined()
  })
  it('produces table props that bind straight to the core', async () => {
    const roles = ordinaryResource()
    const view = mountCore(Table, roles.table().table)
    await flush()

    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['ID', 'Nama'])
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('defaults the query namespace to the resource key and honours an override', () => {
    const roles = ordinaryResource()

    expect(roles.table().table.namespace).toBe('roles')
    expect(roles.table({ namespace: 'archived' }).table.namespace).toBe('archived')
  })

  it('forwards pagination visibility through resource table props', () => {
    const roles = ordinaryResource()

    expect(roles.table({ pagination: 'always' }).table.pagination).toBe('always')
    expect(roles.table({ pagination: false }).table.pagination).toBe(false)
  })

  it('treats parent scoping as an ordinary searchParameters entry', () => {
    const roles = ordinaryResource()

    expect(roles.table({ searchParameters: { role_id: '1' } }).table.searchParameters).toEqual({ role_id: '1' })
  })

  it('memoizes the core props inside the bundle per normalized arguments', () => {
    const roles = ordinaryResource()

    expect(roles.table().table).toBe(roles.table().table)
    expect(roles.table({ searchParameters: { a: 1, b: 2 } }).table).toBe(
      roles.table({ searchParameters: { b: 2, a: 1 } }).table,
    )
    expect(roles.table({ namespace: 'archived' }).table).not.toBe(roles.table().table)
    expect(roles.detail({ id: '1' }).detail).toBe(roles.detail({ id: '1' }).detail)
    expect(roles.form()).toBe(roles.form())
    expect(roles.form({ id: '1' })).not.toBe(roles.form())
  })

  it('keeps core props stable across row-delete handlers without caching closures', () => {
    const roles = ordinaryResource()
    const first = () => undefined
    const second = () => undefined

    expect(roles.table({ onDelete: first }).table).toBe(roles.table({ onDelete: second }).table)
    expect(roles.table({ onDelete: first }).rowControls?.(records[0]).find((action) => action.key === 'delete')?.onSelect).toBeDefined()
    expect(roles.table({ onDelete: second }).rowControls?.(records[0]).find((action) => action.key === 'delete')?.onSelect).toBeDefined()
  })

  it('wires create for form() and update for form({ id })', async () => {
    const create = vi.fn(async () => ({ id: '2' }))
    const update = vi.fn(async (id: string, input: { name: string }) => ({ id, ...input }))
    const detail = vi.fn(async () => records[0])
    const roles = ordinaryResource({ create, update, detail })

    const createProps = roles.form()
    expect(createProps.load).toBeUndefined()
    await createProps.submit({ name: 'Editor' })
    expect(create).toHaveBeenCalledWith({ name: 'Editor' })

    const updateProps = roles.form({ id: '1' })
    expect(updateProps.load).toBeDefined()
    await updateProps.submit({ name: 'Diubah' })
    expect(update).toHaveBeenCalledWith('1', { name: 'Diubah' })
  })

  it('carries prefilled create data for clones and drafts', () => {
    const roles = ordinaryResource()

    expect(roles.form({ initialData: { name: 'Salinan' } }).initialData).toEqual({ name: 'Salinan' })
  })

  it('attaches the operation schema the factory wired', () => {
    const roles = defineResource<Role>({
      key: 'roles',
      fields,
      schemas: {
        create: fromZod(z.object({ name: z.string().min(3) })),
        update: fromZod(z.object({ name: z.string().optional() })),
      },
      operations: { create: async () => ({ id: '2', name: 'Admin' }), update: async () => ({ id: '2', name: 'Admin' }) },
    })

    expect(roles.form().schema?.validate({ name: 'ab' }).success).toBe(false)
    expect(roles.form({ id: '1' }).schema?.validate({}).success).toBe(true)
  })

  it('falls back to the project schema adapter when the resource declares none', async () => {
    const roles = ordinaryResource()
    let schema: unknown
    const view = mountCore(
      Table,
      { fields, data: records },
      {
        adapters: {
          schemas: { find: (resource, operation) => (resource === 'roles' && operation === 'query' ? fromZod(z.object({})) : undefined) },
        },
      },
    )
    await flush()
    schema = roles.table().table.schema
    expect(schema).toBeDefined()
    view.unmount()
  })

  it('restricts surface fields to the declared order', () => {
    const roles = defineResource<Role>({
      key: 'roles',
      fields,
      table: { fields: ['name'] },
      operations: { list: async () => ({ data: records }) },
    })

    expect(Object.keys(roles.table().table.fields as Record<string, unknown>)).toEqual(['name'])
  })

  it('rejects operations the resource does not define', async () => {
    const readOnly = defineResource<Role>({ key: 'roles', fields, operations: { list: async () => ({ data: records }) } })

    expect(readOnly).not.toHaveProperty('capabilities')
    const physical = readOnly as unknown as { form: () => { submit: (input: object) => Promise<unknown> }; remove: (id: string) => Promise<unknown> }
    await expect(physical.form().submit({})).rejects.toThrow('has no create behavior')
    await expect(physical.remove('1')).rejects.toThrow('has no delete behavior')
  })
})

describe('declared identity', () => {
  interface UserRole extends Record<string, unknown> {
    userId: string
    roleId: string
    assignedAt: string
  }

  const assignment: UserRole = { userId: 'u-1', roleId: 'r-1', assignedAt: '2026-07-27' }

  it('extracts record.id when nothing is declared', () => {
    expect(ordinaryResource().identity({ id: '1', name: 'Admin' })).toBe('1')
  })

  it('picks exactly the declared keys for the list spelling', () => {
    const userRoles = defineResource({
      key: 'userRoles',
      fields: { userId: { label: 'Pengguna' } },
      identity: ['userId', 'roleId'],
    })

    expect(userRoles.identity(assignment)).toEqual({ userId: 'u-1', roleId: 'r-1' })
  })

  it('uses the declared extractor verbatim for the function spelling', () => {
    const userRoles = defineResource({
      key: 'userRoles',
      fields: { userId: { label: 'Pengguna' } },
      identity: (record: UserRole) => `${record.userId}:${record.roleId}`,
    })

    expect(userRoles.identity(assignment)).toBe('u-1:r-1')
  })

  it('keys a composite identity by serialization, not by key order', async () => {
    const invalidated: unknown[][] = []
    const queryClient = {
      invalidateQueries: async ({ queryKey }: { queryKey: unknown[] }) => {
        invalidated.push(queryKey)
      },
    }
    registerResourceRuntime({
      adapters: resolveFrameworkAdapters(),
      queryClient: queryClient as unknown as Parameters<typeof registerResourceRuntime>[0]['queryClient'],
    })

    const userRoles = defineResource({
      key: 'userRoles',
      fields: { userId: { label: 'Pengguna' } },
      identity: ['userId', 'roleId'],
    })

    await userRoles.invalidate({ id: { userId: 'a', roleId: 'b' } })
    await userRoles.invalidate({ id: { roleId: 'b', userId: 'a' } })

    const recordKeys = invalidated.filter((key) => key.includes('detail'))
    expect(recordKeys).toHaveLength(2)
    expect(JSON.stringify(recordKeys[0])).toBe(JSON.stringify(recordKeys[1]))
  })

  it('carries a composite identity into action targets and update namespaces', () => {
    const userRoles = defineResource({
      key: 'userRoles',
      fields: { userId: { label: 'Pengguna' } },
      operations: { update: async (id: { userId: string; roleId: string }) => id },
      identity: ['userId', 'roleId'],
      actions: { detail: { permission: 'userRoles.detail', to: { name: 'user-role-detail', params: ({ userId, roleId }) => ({ userId, roleId }) } } },
    })

    expect(userRoles.actions.detail!.to!(userRoles.identity(assignment))).toEqual({
      name: 'user-role-detail',
      params: { userId: 'u-1', roleId: 'r-1' },
    })
    expect(userRoles.form({ id: { userId: 'a', roleId: 'b' } }).namespace).toBe(
      `userRoles.update.${JSON.stringify({ roleId: 'b', userId: 'a' })}`,
    )
  })
})

describe('generated row actions', () => {
  const denyAll: AccessAdapter = { allows: () => false }

  /** Row actions read runtime access adapter; no route passes one by hand. */
  function withAccess(access: AccessAdapter) {
    registerResourceRuntime({ adapters: resolveFrameworkAdapters({ access }), queryClient: createFrameworkQueryClient() })
  }

  it('removes denied row actions instead of disabling them', () => {
    withAccess(denyAll)

    expect(ordinaryResource().table({ onDelete: () => undefined }).rowControls?.(records[0])).toEqual([])
  })

  it('checks access per operation with the resource permission identity', () => {
    const seen: string[] = []
    withAccess({
      allows: ({ permission }) => {
        seen.push(permission!)
        return permission !== 'roles.delete'
      },
    })

    const actions = ordinaryResource().table({ onDelete: () => undefined }).rowControls?.(records[0]) ?? []

    expect(actions.map((action) => action.key)).toEqual(['detail', 'update'])
    expect(seen).toContain('roles.delete')
  })

  it('projects only permitted record actions on the table surface', () => {
    const roles = ordinaryResource()
    const remove = vi.fn()

    expect(roles.table().rowControls?.(records[0]).map((control) => control.key)).toEqual(['detail', 'update'])
    const withDelete = roles.table({ onDelete: remove }).rowControls?.(records[0]) ?? []
    expect(withDelete.map((control) => control.key)).toEqual(['detail', 'update', 'delete'])
    withDelete.find((control) => control.key === 'delete')?.onSelect?.()
    expect(remove).toHaveBeenCalledWith(records[0])

    withAccess(denyAll)
    expect(roles.table({ onDelete: remove }).rowControls?.(records[0])).toEqual([])
  })

  it('generates row links from actions', () => {
    const actions = ordinaryResource().table().rowControls?.({ id: '7', name: 'Admin' }) ?? []

    expect(actions.find((action) => action.key === 'update')?.to).toEqual({ name: 'roles-edit', params: { id: '7' } })
  })
})

describe('row links', () => {
  it('composes the detail route from the identity extractor', () => {
    expect(ordinaryResource().rowLink!({ id: '7', name: 'Admin' })).toEqual({ name: 'roles-detail', params: { id: '7' } })
  })

  it('is absent when the resource has no detail route', () => {
    const routeless = defineResource<Role>({ key: 'roles', fields, operations: { list: async () => ({ data: records }) } })

    expect(routeless.rowLink).toBeUndefined()
  })

  it('carries a composite identity into the link with no route code', () => {
    const userRoles = defineResource({
      key: 'userRoles',
      fields: { userId: { label: 'Pengguna' } },
      identity: ['userId', 'roleId'],
      actions: { detail: { permission: 'userRoles.detail', to: { name: 'user-role-detail', params: ({ userId, roleId }) => ({ userId, roleId }) } } },
    })

    expect(userRoles.rowLink!({ userId: 'u-1', roleId: 'r-1' })).toEqual({
      name: 'user-role-detail',
      params: { userId: 'u-1', roleId: 'r-1' },
    })
  })
})

describe('resource props inside shells', () => {
  it('binds a resource to ListView with no inferred page controls', async () => {
    const roles = ordinaryResource()
    const view = mountCore(ListView, { title: 'Role', ...roles.table() })
    await flush()

    expect(view.find('[data-control="create"]')).toBeNull()
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('renders only permitted resource row actions in ListView', async () => {
    const resource = {
      table: () => ({
        table: { fields, data: records },
        rowControls: () => [
          { key: 'detail', label: 'Detail', to: '/roles/1' },
          { key: 'update', label: 'Ubah', to: '/roles/1/edit' },
        ],
      }),
    }
    const view = mountCore(ListView, { resource })
    await flush()

    expect(view.find('[aria-label="Detail"]')).not.toBeNull()
    expect(view.find('[aria-label="Ubah"]')).not.toBeNull()
    expect(view.find('[aria-label="Hapus"]')).toBeNull()
    view.unmount()
  })

  it('gives an explicit row-actions slot precedence over resource row controls', async () => {
    const resource = {
      table: () => ({
        table: { fields, data: records },
        rowControls: () => [{ key: 'detail', label: 'Resource detail', to: '/roles/1' }],
      }),
    }
    const view = mountCore(ListView, { resource }, {
      slots: { 'row-actions': () => h('button', { 'aria-label': 'Slot action' }, 'Slot action') },
    })
    await flush()

    expect(view.find('[aria-label="Slot action"]')).not.toBeNull()
    expect(view.find('[aria-label="Resource detail"]')).toBeNull()
    view.unmount()
  })

  it('binds create and update resources to FormView with no mode', async () => {
    const create = vi.fn(async () => ({ id: '2', name: 'Admin' }))
    const update = vi.fn(async (id: string, input: { name: string }) => ({ id, ...input }))
    const roles = ordinaryResource({ create, update })

    const createView = mountCore(FormView, { resource: roles })
    await flush()
    createView.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const updateView = mountCore(FormView, { resource: roles, id: '1' })
    await flush()
    updateView.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(create).toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Admin' }))
    createView.unmount()
    updateView.unmount()
  })

  it('passes formOptions to the resource factory', async () => {
    const create = vi.fn(async () => ({ id: '2', name: 'Admin' }))
    const roles = ordinaryResource({ create })
    const form = vi.spyOn(roles, 'form')
    const formOptions = { initialData: { name: 'Salinan' }, searchParameters: { source: 'clone' } }
    const view = mountCore(FormView, { resource: roles, formOptions })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(form).toHaveBeenCalledWith(formOptions)
    expect(create).toHaveBeenCalledWith({ name: 'Salinan' })
    view.unmount()
  })

  it('supports raw custom form props', async () => {
    const submit = vi.fn(async () => undefined)
    const load = vi.fn(async () => ({ name: 'Loaded' }))
    const view = mountCore(FormView, { formProps: { fields, load, submit } })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(load).toHaveBeenCalledOnce()
    expect(submit).toHaveBeenCalledWith({ name: 'Loaded' })
    view.unmount()
  })
})
