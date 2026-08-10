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
    expect(fields(businessCategories.table().table.fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(businessCategories.detail({ id: '1' }).detail.fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(businessCategories.form().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'text', 'textarea', 'switch'])
    expect(formFields.every((field) => field.source === undefined)).toBe(true)
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })
})
