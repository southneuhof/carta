import { describe, expect, it } from 'vitest'
import { defineResource } from '../defineResource'
import { defineFields } from '../../fields'
import { registerResourceRuntime, resetResourceRuntimeForTests } from '../runtime'
import { createFrameworkQueryClient } from '../../query/client'
import { resolveFrameworkAdapters } from '../../adapters/projectAdapters'

type Record = { id: string; name: string }
const fields = defineFields<Record>()({ name: { label: 'Name' } })

function resource(access = { allows: () => true }) {
  registerResourceRuntime({ queryClient: createFrameworkQueryClient(), adapters: resolveFrameworkAdapters({ access }) })
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
})
