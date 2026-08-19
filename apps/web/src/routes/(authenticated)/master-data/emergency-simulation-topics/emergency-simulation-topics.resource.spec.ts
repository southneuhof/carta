import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults, resourceActionForRoute } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { emergencySimulationTopics } from './emergency-simulation-topics.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Topik Simulasi Tanggap Darurat resource', () => {
  it('exposes only the configured domain fields', () => {
    const keys = ['name']
    expect(fields(emergencySimulationTopics.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(emergencySimulationTopics.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(emergencySimulationTopics.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.label)).toEqual(['Nama'])
    expect(formFields.find((field) => field.key === 'name')?.props).toMatchObject({ required: true })
  })

  it('maps standard CRUD routes', () => {
    const list = emergencySimulationTopics.list()
    expect(resourceActionForRoute('master-data-emergency-simulation-topics')).toMatchObject({ resourceKey: 'emergency-simulation-topics', action: 'list', permission: 'view-emergency-simulation-topics' })
    expect(resourceActionForRoute('master-data-emergency-simulation-topics-detail')).toMatchObject({ resourceKey: 'emergency-simulation-topics', action: 'detail', permission: 'view-emergency-simulation-topics' })
    expect(resourceActionForRoute('master-data-emergency-simulation-topics-create')).toMatchObject({ resourceKey: 'emergency-simulation-topics', action: 'create', permission: 'create-emergency-simulation-topics' })
    expect(resourceActionForRoute('master-data-emergency-simulation-topics-edit')).toMatchObject({ resourceKey: 'emergency-simulation-topics', action: 'update', permission: 'update-emergency-simulation-topics' })
    expect(list.createRoute).toEqual({ name: 'master-data-emergency-simulation-topics-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-topics-detail', params: { emergencySimulationTopicId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-emergency-simulation-topics-edit', params: { emergencySimulationTopicId: '1' } })
    expect(emergencySimulationTopics.delete({ id: '1' })).toHaveProperty('run')
  })
})
