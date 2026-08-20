import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { toolsBrands } from './tools-brands.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Merk Alat Berat & Alat Ukur/Uji resource', () => {
  it('exposes only the configured domain fields', () => {
    expect(fields(toolsBrands.list().fields, 'table').map((field) => field.key)).toEqual(['name', 'description', 'active'])
    expect(fields(toolsBrands.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(['name', 'description', 'active'])
    expect(fields(toolsBrands.create().fields, 'form').map((field) => field.key)).toEqual(['name', 'categoryCode', 'description', 'active'])
  })

  it('maps standard CRUD routes', () => {
    const list = toolsBrands.list()
    expect(list.createRoute).toEqual({ name: 'master-data-tools-brands-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-tools-brands-detail', params: { toolsBrandId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-tools-brands-edit', params: { toolsBrandId: '1' } })
    expect(toolsBrands.delete({ id: '1' })).toHaveProperty('run')
  })
})
