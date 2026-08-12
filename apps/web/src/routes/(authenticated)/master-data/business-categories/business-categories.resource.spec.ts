import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { businessCategories } from './business-categories.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('business categories resource', () => {
  it('uses the four business fields on every standard surface', () => {
    const keys = ['name', 'code', 'description', 'active']
    expect(fields(businessCategories.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(businessCategories.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(businessCategories.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'text', 'textarea', 'switch'])
    expect(formFields.every((field) => field.source === undefined)).toBe(true)
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })
})
