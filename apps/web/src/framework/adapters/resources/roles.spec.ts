import { describe, expect, it, vi } from 'vitest'
import { standardControls } from '@southneuhof/is-vue-framework'
import type { AccessAdapter } from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: {
      list: { $get: vi.fn(async () => ok({ data: [{ id: '1', name: 'Admin' }], total: 1, limit: 10 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: '1', name: 'Admin' } })) } },
      create: { $post: vi.fn(async () => ok({ data: { id: '2' } })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: '1' } })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
      ':roleId': { permissions: { $get: vi.fn(async () => ok({ data: [], total: 0 })) } },
    },
  },
}))

const { roles, rolePermissions } = await import('./roles')

describe('roles resource', () => {
  it('derives every ordinary operation from the RPC route', () => {
    expect(roles.capabilities).toEqual({ list: true, detail: true, create: true, update: true, delete: true })
  })

  it('produces core props that bind directly, with no adapter shape', () => {
    const table = roles.table()
    const detail = roles.detail({ id: '1' })
    const create = roles.form()
    const update = roles.form({ id: '1' })

    expect(table.namespace).toBe('roles')
    expect(typeof table.load).toBe('function')
    expect(detail.id).toBe('1')
    expect(create.load).toBeUndefined()
    expect(typeof update.load).toBe('function')
    expect(Object.keys(create.fields as Record<string, unknown>)).toEqual(['name'])
  })

  it('validates create and update through the shared schemas', () => {
    expect(roles.form().schema?.validate({}).success).toBe(false)
    expect(roles.form().schema?.validate({ name: 'Editor' }).success).toBe(true)
    expect(roles.form({ id: '1' }).schema?.validate({}).success).toBe(true)
  })

  it('infers standard controls from behavior and routes', () => {
    expect(standardControls({ resource: roles, surface: 'list' }).map((control) => control.key)).toEqual(['create'])
    expect(standardControls({ resource: roles, surface: 'detail', id: '1', onDelete: () => undefined }).map((control) => control.key)).toEqual(['list', 'update', 'delete'])
  })

  it('hides denied controls entirely', () => {
    const readOnly: AccessAdapter = { allows: ({ operation }) => operation === 'list' }

    expect(standardControls({ resource: roles, surface: 'list', access: readOnly })).toEqual([])
    expect(standardControls({ resource: roles, surface: 'detail', id: '1', access: readOnly, onDelete: () => undefined }).map((control) => control.key)).toEqual(['list'])
  })
})

describe('role permissions resource', () => {
  it('is scoped by an ordinary searchParameters entry, with no parent vocabulary', () => {
    const props = rolePermissions.table({ searchParameters: { role_id: '1' } })

    expect(props.searchParameters).toEqual({ role_id: '1' })
    expect(Object.keys(props)).not.toContain('parent')
  })

  it('exposes only the list behavior — no fabricated operations', () => {
    expect(rolePermissions.capabilities).toEqual({ list: true, detail: false, create: false, update: false, delete: false })
  })

  it('returns an empty collection when no role is in scope', async () => {
    expect(await rolePermissions.table().load!({ query: {}, searchParameters: {} })).toEqual({ data: [] })
  })
})
