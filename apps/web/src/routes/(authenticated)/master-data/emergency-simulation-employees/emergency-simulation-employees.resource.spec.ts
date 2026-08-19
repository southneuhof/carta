import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { emergencySimulationEmployees } from './emergency-simulation-employees.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Karyawan Terlibat Simulasi Tanggap Darurat resource', () => {
  it('exposes only the configured domain fields', () => {
    const keys = ['name']
    expect(fields(emergencySimulationEmployees.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(emergencySimulationEmployees.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    expect(fields(emergencySimulationEmployees.create().fields, 'form').map((field) => field.key)).toEqual(keys)
  })

  it('maps standard CRUD routes', () => {
    const list = emergencySimulationEmployees.list()
    expect(list.createRoute).toEqual({ name: 'master-data-emergency-simulation-employees-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-employees-detail', params: { emergencySimulationEmployeeId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-employees-edit', params: { emergencySimulationEmployeeId: '1' } })
    expect(emergencySimulationEmployees.delete({ id: '1' })).toHaveProperty('run')
  })
})
