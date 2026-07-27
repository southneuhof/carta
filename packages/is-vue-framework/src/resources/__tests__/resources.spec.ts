import { afterEach, describe, expect, it, vi } from 'vitest'
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
      list: spies.list ?? (async () => ({ data: records, total: 1, limit: 10 })),
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

  /**
   * Control customization and a delete handler never key the memo, so the table
   * keeps its state across a control change; the handler itself is never cached
   * because a stale closure would outlive the component that supplied it.
   */
  it('keeps core props stable across control arguments without caching handlers', () => {
    const roles = ordinaryResource()
    const first = () => undefined
    const second = () => undefined

    expect(roles.table({ controls: { labels: { create: 'Baru' } } }).table).toBe(roles.table().table)
    expect(roles.detail({ id: '1', onDelete: first }).detail).toBe(roles.detail({ id: '1', onDelete: second }).detail)
    expect(roles.detail({ id: '1', onDelete: first }).controls.find((control) => control.key === 'delete')?.onSelect).toBe(
      first,
    )
    expect(roles.detail({ id: '1', onDelete: second }).controls.find((control) => control.key === 'delete')?.onSelect).toBe(
      second,
    )
  })

  it('wires create for form() and update for form({ id })', async () => {
    const create = vi.fn(async () => ({ id: '2' }))
    const update = vi.fn(async () => undefined)
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
      operations: { create: async () => undefined, update: async () => undefined },
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

    expect(readOnly.capabilities).toEqual({ list: true, detail: false, create: false, update: false, delete: false })
    await expect(readOnly.form().submit({})).rejects.toThrow('has no create behavior')
    await expect(readOnly.remove('1')).rejects.toThrow('has no delete behavior')
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

describe('standard controls, projected by the surface factories', () => {
  const denyAll: AccessAdapter = { allows: () => false }

  /** Controls read the runtime access adapter; no route passes one by hand. */
  function withAccess(access: AccessAdapter) {
    registerResourceRuntime({ adapters: resolveFrameworkAdapters({ access }), queryClient: createFrameworkQueryClient() })
  }

  it('renders create on the list surface when behavior, route, and access allow', () => {
    expect(ordinaryResource().table().controls.map((control) => control.key)).toEqual(['create'])
  })

  it('hides controls whose behavior does not exist', () => {
    const readOnly = defineResource<Role>({
      key: 'roles',
      fields,
      operations: { list: async () => ({ data: records }) },
      actions: {
        list: { permission: 'roles.list', to: { name: 'roles-list' } },
        create: { permission: 'roles.create', to: { name: 'test-route' } },
        update: { permission: 'roles.update', to: { name: 'roles-edit', params: (id) => ({ id }) } },
      },
    })

    expect(readOnly.table().controls).toEqual([])
    expect(readOnly.detail({ id: '1' }).controls.map((control) => control.key)).toEqual(['list'])
  })

  it('hides controls whose action target is missing', () => {
    const routeless = defineResource<Role>({
      key: 'roles',
      fields,
      operations: { list: async () => ({ data: records }), create: async () => undefined },
    })

    expect(routeless.table().controls).toEqual([])
  })

  it('removes denied controls instead of disabling them', () => {
    withAccess(denyAll)

    expect(ordinaryResource().detail({ id: '1', onDelete: () => undefined }).controls).toEqual([])
  })

  it('checks access per operation with the resource permission identity', () => {
    const seen: string[] = []
    withAccess({
      allows: ({ permission }) => {
        seen.push(permission!)
        return permission !== 'roles.delete'
      },
    })

    const controls = ordinaryResource().detail({ id: '1', onDelete: () => undefined }).controls

    expect(controls.map((control) => control.key)).toEqual(['list', 'update'])
    expect(seen).toContain('roles.delete')
  })

  it('lets an override hide, relabel, or redirect a standard control', () => {
    const controls = ordinaryResource().detail({
      id: '1',
      onDelete: () => undefined,
      controls: { overrides: { list: false, update: { label: 'Sunting', to: '/custom/1' } } },
    }).controls

    expect(controls.map((control) => control.key)).toEqual(['update', 'delete'])
    expect(controls[0]).toMatchObject({ label: 'Sunting', to: '/custom/1' })
  })

  it('appends custom controls after the standard set', () => {
    const controls = ordinaryResource().table({
      controls: { extra: [{ key: 'export', label: 'Excel', onSelect: () => undefined }] },
    }).controls

    expect(controls.map((control) => control.key)).toEqual(['create', 'export'])
  })

  it('offers delete only with a handler, so no control can lack one', () => {
    const roles = ordinaryResource()

    expect(roles.detail({ id: '1' }).controls.map((control) => control.key)).toEqual(['list', 'update'])
    expect(roles.detail({ id: '1', onDelete: () => undefined }).controls.map((control) => control.key)).toEqual([
      'list',
      'update',
      'delete',
    ])
    for (const control of roles.detail({ id: '1', onDelete: () => undefined }).controls) {
      expect(Boolean(control.to || control.onSelect)).toBe(true)
    }
  })

  it('generates links from actions', () => {
    const controls = ordinaryResource().detail({ id: '7', onDelete: () => undefined }).controls

    expect(controls.find((control) => control.key === 'update')?.to).toEqual({ name: 'roles-edit', params: { id: '7' } })
    expect(controls.find((control) => control.key === 'list')?.to).toEqual({ name: 'roles-list' })
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
  it('binds a resource to ListView with inferred controls', async () => {
    const roles = ordinaryResource()
    const view = mountCore(ListView, { title: 'Role', ...roles.table() })
    await flush()

    expect(view.find('[data-control="create"]')?.getAttribute('href')).toBe('/')
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('binds create and update forms to FormView with no mode', async () => {
    const create = vi.fn(async () => undefined)
    const update = vi.fn(async () => undefined)
    const roles = ordinaryResource({ create, update })

    const createView = mountCore(FormView, { form: roles.form() })
    await flush()
    createView.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const updateView = mountCore(FormView, { form: roles.form({ id: '1' }) })
    await flush()
    updateView.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(create).toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Admin' }))
    createView.unmount()
    updateView.unmount()
  })

  it('supports call-site overrides by plain object spread', async () => {
    const roles = ordinaryResource()
    const submit = vi.fn(async () => undefined)
    const view = mountCore(FormView, { form: { ...roles.form({ id: '1' }), submit } })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).toHaveBeenCalled()
    view.unmount()
  })
})
