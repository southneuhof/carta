import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { emergencySimulationTools } from './emergency-simulation-tools.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Perlengkapan Tanggap Darurat resource', () => {
  it('exposes only the configured domain fields', () => {
    const keys = ["name"]
    expect(fields(emergencySimulationTools.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(emergencySimulationTools.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    expect(fields(emergencySimulationTools.create().fields, 'form').map((field) => field.key)).toEqual(keys)
  })

  it('maps standard CRUD routes', () => {
    const list = emergencySimulationTools.list()
    expect(list.createRoute).toEqual({ name: 'master-data-emergency-simulation-tools-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-tools-detail', params: { emergencySimulationToolId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-tools-edit', params: { emergencySimulationToolId: '1' } })
    expect(emergencySimulationTools.delete({ id: '1' })).toHaveProperty('run')
  })
})

