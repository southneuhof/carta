import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { tollCausesAccidents } from './toll-causes-accidents.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Faktor Kecelakaan resource', () => {
  it('uses the approved fields and category select', () => {
    const displayKeys = ['category', 'name', 'code', 'description', 'active']
    const formKeys = ['categoryCode', 'name', 'code', 'description', 'active']
    expect(fields(tollCausesAccidents.list().fields, 'table').map((field) => field.key)).toEqual(displayKeys)
    expect(fields(tollCausesAccidents.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(displayKeys)
    const formFields = fields(tollCausesAccidents.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(formKeys)
    expect(formFields.map((field) => field.renderer)).toEqual(['select', 'text', 'text', 'textarea', 'switch'])
    expect(formFields[0]?.source).toEqual([
      { id: 'driver', name: 'Pengemudi' },
      { id: 'vehicle', name: 'Kendaraan' },
      { id: 'road', name: 'Jalan' },
      { id: 'environment', name: 'Lingkungan' },
    ])
  })

  it('shows category names without changing the write field', () => {
    const displayField = fields(tollCausesAccidents.list().fields, 'table')[0]
    expect(displayField?.read?.({ category: { name: 'Pengemudi' } } as never, {})).toBe('Pengemudi')
    expect(displayField?.read?.({ category: null } as never, {})).toBe('—')
  })

  it('keeps the category filter and standard routes', () => {
    const list = tollCausesAccidents.list({ searchParameters: { categoryCode: 'driver' } })
    expect(list.searchParameters).toEqual({ categoryCode: 'driver' })
    expect(list.createRoute).toEqual({ name: 'master-data-toll-causes-accidents-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-toll-causes-accidents-detail', params: { tollCausesAccidentsId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-toll-causes-accidents-edit', params: { tollCausesAccidentsId: '1' } })
    expect(tollCausesAccidents.delete({ id: '1' })).toHaveProperty('run')
  })
})
