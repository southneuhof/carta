import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
  resourceActionForRoute,
} from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { permitApds } from './permit-category-apd.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Permit APD resource', () => {
  it('keeps the child field contract and hides the relation', () => {
    const resource = permitApds('category-1')
    const keys = ['name', 'description', 'active']
    expect(fields(resource.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(resource.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(resource.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Deskripsi', 'Status'])
    expect(resource.create().initialData).toEqual({ permitCategoryApdId: 'category-1', active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'code', 'permitCategoryApdId', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps scoped child actions to nested routes', () => {
    const resource = permitApds('category-1')
    const list = resource.list()
    expect(resourceActionForRoute('master-data-permit-category-apd-detail-apd')).toMatchObject({ resourceKey: 'permit-apd', action: 'list', permission: 'view-permit-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-detail-apd-create')).toMatchObject({ resourceKey: 'permit-apd', action: 'create', permission: 'create-permit-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-detail-apd-detail')).toMatchObject({ resourceKey: 'permit-apd', action: 'detail', permission: 'view-permit-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-detail-apd-edit')).toMatchObject({ resourceKey: 'permit-apd', action: 'update', permission: 'update-permit-apd' })
    expect(list.createRoute).toEqual({ name: 'master-data-permit-category-apd-detail-apd-create', params: { permitCategoryApdId: 'category-1' } })
    expect(list.detailRoute?.({ id: 'apd-1' } as never)).toEqual({ name: 'master-data-permit-category-apd-detail-apd-detail', params: { permitCategoryApdId: 'category-1', permitApdId: 'apd-1' } })
    expect(list.updateRoute?.({ id: 'apd-1' } as never)).toEqual({ name: 'master-data-permit-category-apd-detail-apd-edit', params: { permitCategoryApdId: 'category-1', permitApdId: 'apd-1' } })
    expect(resource.delete({ id: 'apd-1' })).toHaveProperty('run')
  })

  it('allows multiple parent scopes to share the nested route metadata', () => {
    expect(() => permitApds('category-2')).not.toThrow()
    expect(permitApds('category-2').list({ namespace: 'permit-apd.category-2' }).namespace).toBe('permit-apd.category-2')
  })
})
