import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { defineResource } from '../defineResource'
import { standardControls } from '../controls'
import { resetResourceRuntimeForTests } from '../runtime'
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

/** The ordinary case: a catalog, operations, routes. No escape hatches. */
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
    routes: {
      list: '/roles',
      create: '/roles/new',
      detail: (id) => `/roles/${id}`,
      update: (id) => `/roles/${id}/edit`,
    },
  })
}

afterEach(() => resetResourceRuntimeForTests())

describe('defineResource factories', () => {
  it('produces table props that bind straight to the core', async () => {
    const roles = ordinaryResource()
    const view = mountCore(Table, roles.table())
    await flush()

    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['ID', 'Nama'])
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('defaults the query namespace to the resource key and honours an override', () => {
    const roles = ordinaryResource()

    expect(roles.table().namespace).toBe('roles')
    expect(roles.table({ namespace: 'archived' }).namespace).toBe('archived')
  })

  it('treats parent scoping as an ordinary searchParameters entry', () => {
    const roles = ordinaryResource()

    expect(roles.table({ searchParameters: { role_id: '1' } }).searchParameters).toEqual({ role_id: '1' })
  })

  it('memoizes factory results per normalized arguments', () => {
    const roles = ordinaryResource()

    expect(roles.table()).toBe(roles.table())
    expect(roles.table({ searchParameters: { a: 1, b: 2 } })).toBe(roles.table({ searchParameters: { b: 2, a: 1 } }))
    expect(roles.table({ namespace: 'archived' })).not.toBe(roles.table())
    expect(roles.detail({ id: '1' })).toBe(roles.detail({ id: '1' }))
    expect(roles.form()).toBe(roles.form())
    expect(roles.form({ id: '1' })).not.toBe(roles.form())
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
    schema = roles.table().schema
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

    expect(Object.keys(roles.table().fields as Record<string, unknown>)).toEqual(['name'])
  })

  it('rejects operations the resource does not define', async () => {
    const readOnly = defineResource<Role>({ key: 'roles', fields, operations: { list: async () => ({ data: records }) } })

    expect(readOnly.capabilities).toEqual({ list: true, detail: false, create: false, update: false, delete: false })
    await expect(readOnly.form().submit({})).rejects.toThrow('has no create behavior')
    await expect(readOnly.remove('1')).rejects.toThrow('has no delete behavior')
  })
})

describe('standard controls', () => {
  const denyAll: AccessAdapter = { allows: () => false }

  it('renders create on the list surface when behavior, route, and access allow', () => {
    const roles = ordinaryResource()

    expect(standardControls({ resource: roles, surface: 'list' }).map((control) => control.key)).toEqual(['create'])
  })

  it('hides controls whose behavior does not exist', () => {
    const readOnly = defineResource<Role>({
      key: 'roles',
      fields,
      operations: { list: async () => ({ data: records }) },
      routes: { list: '/roles', create: '/roles/new', update: (id) => `/roles/${id}/edit` },
    })

    expect(standardControls({ resource: readOnly, surface: 'list' })).toEqual([])
    expect(standardControls({ resource: readOnly, surface: 'detail', id: '1' }).map((control) => control.key)).toEqual(['list'])
  })

  it('hides controls whose route target is missing', () => {
    const routeless = defineResource<Role>({
      key: 'roles',
      fields,
      operations: { list: async () => ({ data: records }), create: async () => undefined },
    })

    expect(standardControls({ resource: routeless, surface: 'list' })).toEqual([])
  })

  it('removes denied controls instead of disabling them', () => {
    const roles = ordinaryResource()
    const controls = standardControls({ resource: roles, surface: 'detail', id: '1', access: denyAll, onDelete: () => undefined })

    expect(controls).toEqual([])
  })

  it('checks access per operation with the resource permission identity', () => {
    const roles = ordinaryResource()
    const seen: string[] = []
    const access: AccessAdapter = {
      allows: ({ permission }) => {
        seen.push(permission!)
        return permission !== 'roles.delete'
      },
    }

    const controls = standardControls({ resource: roles, surface: 'detail', id: '1', access, onDelete: () => undefined })

    expect(controls.map((control) => control.key)).toEqual(['list', 'update'])
    expect(seen).toContain('roles.delete')
  })

  it('lets an override hide, relabel, or redirect a standard control', () => {
    const roles = ordinaryResource()
    const controls = standardControls({
      resource: roles,
      surface: 'detail',
      id: '1',
      onDelete: () => undefined,
      overrides: { list: false, update: { label: 'Sunting', to: '/custom/1' } },
    })

    expect(controls.map((control) => control.key)).toEqual(['update', 'delete'])
    expect(controls[0]).toMatchObject({ label: 'Sunting', to: '/custom/1' })
  })

  it('diagnoses a control with neither handler nor route target', () => {
    const roles = ordinaryResource()

    expect(() => standardControls({ resource: roles, surface: 'detail', id: '1' })).toThrow(
      'has neither a handler nor a route target',
    )
  })

  it('requires the record id for detail controls', () => {
    const roles = ordinaryResource()

    expect(() => standardControls({ resource: roles, surface: 'detail' })).toThrow('need the record id')
  })

  it('generates links without owning routes', () => {
    const roles = ordinaryResource()
    const controls = standardControls({ resource: roles, surface: 'detail', id: '7', onDelete: () => undefined })

    expect(controls.find((control) => control.key === 'update')?.to).toBe('/roles/7/edit')
    expect(controls.find((control) => control.key === 'list')?.to).toBe('/roles')
  })
})

describe('resource props inside shells', () => {
  it('binds a resource to ListView with inferred controls', async () => {
    const roles = ordinaryResource()
    const view = mountCore(ListView, {
      title: 'Role',
      table: roles.table(),
      controls: standardControls({ resource: roles, surface: 'list' }),
    })
    await flush()

    expect(view.find('[data-control="create"]')?.getAttribute('href')).toBe('/roles/new')
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
