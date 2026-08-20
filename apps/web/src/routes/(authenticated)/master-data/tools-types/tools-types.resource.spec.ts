import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { toolsTypes } from './tools-types.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Jenis Alat Berat & Alat Ukur/Uji resource', () => {
  it('exposes only the configured domain fields', () => {
    expect(fields(toolsTypes.list().fields, 'table').map((field) => field.key)).toEqual(['name', 'description', 'active'])
    expect(fields(toolsTypes.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(['name', 'description', 'active'])
    expect(fields(toolsTypes.create().fields, 'form').map((field) => field.key)).toEqual(['name', 'categoryCode', 'description', 'active'])
  })

  it('maps standard CRUD routes', () => {
    const list = toolsTypes.list()
    expect(list.createRoute).toEqual({ name: 'master-data-tools-types-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-tools-types-detail', params: { toolsTypeId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-tools-types-edit', params: { toolsTypeId: '1' } })
    expect(toolsTypes.delete({ id: '1' })).toHaveProperty('run')
  })
})
