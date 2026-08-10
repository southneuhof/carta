import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { uoms } from './uoms.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('UOM resource', () => {
  it('uses name and active on every standard surface', () => {
    const keys = ['name', 'active']
    expect(fields(uoms.table().table.fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(uoms.detail({ id: '1' }).detail.fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(uoms.form().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'switch'])
  })
})
