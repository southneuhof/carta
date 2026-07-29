import { describe, expect, it } from 'vitest'
import { defineResource } from '../defineResource'
import { defineFields } from '../../fields'
import { registerResourceRuntime, resetResourceRuntimeForTests } from '../runtime'
import { createFrameworkQueryClient } from '../../query/client'
import { resolveFrameworkAdapters } from '../../adapters/projectAdapters'
import { resolveFrameworkFieldDefaults } from '../../fields/defaults'
import { resolveFields } from '../../fields/resolve'

type Record = { id: string; name: string }
const fields = defineFields<Record>()({ name: { label: 'Name' } })

function resource(access = { allows: () => true }) {
  registerResourceRuntime({
    queryClient: createFrameworkQueryClient(),
    adapters: resolveFrameworkAdapters({ access }),
    fieldDefaults: resolveFrameworkFieldDefaults(),
  })
  return defineResource({
    key: 'records', fields,
    capabilities: {
      list: { handler: async () => ({ data: [{ id: '1', name: 'One' }] }), permission: 'records.list', to: { name: 'records' } },
      create: { handler: async (input: { name: string }) => ({ id: '2', ...input }), permission: 'records.create', to: { name: 'records-create' } },
      detail: { handler: async ({ id }) => ({ id: String(id), name: 'One' }), permission: 'records.detail', to: { name: 'records-detail', params: (id) => ({ id }) } },
      update: { handler: async (id, input: { name?: string }) => ({ id: String(id), name: input.name ?? 'One' }), permission: 'records.update', to: { name: 'records-edit', params: (id) => ({ id }) } },
      delete: { handler: async () => undefined, permission: 'records.delete' },
      verify: { handler: async (_id: string, _result: 'approved' | 'rejected') => undefined, permission: 'records.verify' },
    },
  })
}

describe('resource capabilities', () => {
  it('uses app field defaults as base definitions on every resource surface', () => {
    type DefaultRecord = { id: string; name: string; createdAt: string }
    type DefaultCreate = { name: string }
    const fieldDefaults = resolveFrameworkFieldDefaults({
      fields: {
        name: { label: 'Default name', form: { renderer: 'text' } },
        createdAt: {
          label: 'Created',
          display: { format: 'datetime' },
          table: { class: 'whitespace-nowrap' },
        },
      },
    })
    registerResourceRuntime({
      queryClient: createFrameworkQueryClient(),
      adapters: resolveFrameworkAdapters(),
      fieldDefaults,
    })
    const value = defineResource({
      key: 'defaulted-records',
      fields: defineFields<DefaultRecord, DefaultCreate>()({}),
      table: { fields: ['createdAt'] },
      detail: { fields: ['createdAt'] },
      form: { fields: ['name'] },
      capabilities: {
        list: { handler: async () => ({ data: [] as DefaultRecord[] }), permission: null },
        detail: {
          handler: async ({ id }) => ({ id: String(id), name: 'One', createdAt: '2026-01-01' }),
          permission: null,
        },
        create: {
          handler: async (input: DefaultCreate) => ({ id: '1', createdAt: '2026-01-01', ...input }),
          permission: null,
        },
      },
    })

    const tableFields = value.table().table.fields
    const detailFields = value.detail({ id: '1' }).detail.fields
    const formFields = value.form().fields
    expect(Object.keys(tableFields as object)).toEqual(['createdAt'])
    expect(Object.keys(detailFields as object)).toEqual(['createdAt'])
    expect(Object.keys(formFields as object)).toEqual(['name'])
    expect(resolveFields({
      fields: tableFields,
      surface: 'table',
      defaultFields: fieldDefaults.fields,
    })[0]).toMatchObject({
      label: 'Created',
      format: 'datetime',
      class: 'whitespace-nowrap',
    })
    resetResourceRuntimeForTests()
  })

  it('keeps resource metadata above app defaults and rejects fields absent from both catalogs', () => {
    type DefaultRecord = { id: string; createdAt: string; missing: string }
    const fieldDefaults = resolveFrameworkFieldDefaults({
      fields: { createdAt: { label: 'Default label' } },
    })
    registerResourceRuntime({
      queryClient: createFrameworkQueryClient(),
      adapters: resolveFrameworkAdapters(),
      fieldDefaults,
    })
    const value = defineResource({
      key: 'overridden-records',
      fields: defineFields<DefaultRecord>()({
        createdAt: { label: 'Resource label' },
      }),
      table: { fields: ['createdAt'] },
      capabilities: {
        list: { handler: async () => ({ data: [] as DefaultRecord[] }), permission: null },
      },
    })
    expect(resolveFields({
      fields: value.table().table.fields,
      surface: 'table',
      defaultFields: fieldDefaults.fields,
    })[0].label).toBe('Resource label')

    const invalid = defineResource({
      key: 'invalid-defaulted-records',
      fields: defineFields<DefaultRecord>()({}),
      table: { fields: ['missing'] },
      capabilities: {
        list: { handler: async () => ({ data: [] as DefaultRecord[] }), permission: null },
      },
    })
    expect(() => invalid.table()).toThrow('Unknown field "missing"')
    resetResourceRuntimeForTests()
  })

  it('keeps exact custom capability handler and standard surfaces', () => {
    const value = resource()
    expect(value.capabilities.verify.handler('1', 'approved')).resolves.toBeUndefined()
    expect(value.table().createRoute).toEqual({ name: 'records-create' })
    const surface = value.table()
    expect(surface.detailRoute?.({ id: '1', name: 'One' })).toEqual({ name: 'records-detail', params: { id: '1' } })
    expect(surface.updateRoute?.({ id: '1', name: 'One' })).toEqual({ name: 'records-edit', params: { id: '1' } })
    expect(surface.canDelete?.({ id: '1', name: 'One' })).toBe(true)
    resetResourceRuntimeForTests()
  })

  it('filters create and row capabilities through access and visibility', () => {
    const value = resource({ allows: ({ operation }: { operation: string }) => operation === 'list' })
    expect(value.table().createRoute).toBeUndefined()
    const surface = value.table()
    expect(surface.detailRoute?.({ id: '1', name: 'One' })).toBeUndefined()
    expect(surface.canDelete?.({ id: '1', name: 'One' })).toBe(false)
    resetResourceRuntimeForTests()
  })

  it('does not infer custom capabilities into table actions', () => {
    const value = resource()
    expect(value.table().canDelete?.({ id: '1', name: 'One' })).toBe(true)
    resetResourceRuntimeForTests()
  })

  it('selects create/update validators and forwards factory context', () => {
    registerResourceRuntime({
      queryClient: createFrameworkQueryClient(),
      adapters: resolveFrameworkAdapters(),
      fieldDefaults: resolveFrameworkFieldDefaults(),
    })
    const create = () => undefined
    const update = () => undefined
    const value = defineResource({
      key: 'validator-records', fields,
      capabilities: {
        create: { handler: async (input: { name: string }) => ({ id: '1', ...input }), permission: null },
        update: { handler: async (id: string, input: { name?: string }) => ({ id, name: input.name ?? '' }), permission: null },
      },
      validators: { create: [create], update: [update] },
    })
    expect(value.form({ context: { source: 'create' } }).validators).toEqual([create])
    expect(value.form({ id: '1', context: { source: 'update' } }).validators).toEqual([update])
    expect(value.form({ id: '1', context: { source: 'update' } }).context).toEqual({ source: 'update' })
    resetResourceRuntimeForTests()
  })
})
