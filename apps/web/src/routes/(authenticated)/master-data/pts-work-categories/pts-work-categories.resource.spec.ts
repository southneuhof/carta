import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from './pts-work-categories.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('PTS work categories resource', () => {
  it('uses the approved catalog fields on every standard surface', () => {
    const keys = ['name', 'active']
    expect(fields(ptsWorkCategories.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(ptsWorkCategories.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(ptsWorkCategories.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'switch'])
    expect(formFields.every((field) => field.source === undefined)).toBe(true)
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('keeps standard delete execution on the returned action object', () => {
    expect(ptsWorkCategories.delete({ id: '1' })).toHaveProperty('run')
  })
})
