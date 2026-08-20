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
import { findingCategories, findingCauses, findingTypes } from './hsse-observation.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('HSSE observation resources', () => {
  it('keeps the main and child field contracts', () => {
    expect(fields(findingTypes.list().fields, 'table').map((field) => field.key)).toEqual(['name'])
    expect(fields(findingTypes.create().fields, 'form').map((field) => field.key)).toEqual(['name', 'code', 'findingCriteriaCode', 'description', 'active'])
    expect(fields(findingCategories('type-1').list().fields, 'table').map((field) => field.key)).toEqual(['name', 'code', 'description', 'active'])
    expect(fields(findingCauses('type-1', 'category-1').list().fields, 'table').map((field) => field.key)).toEqual(['name', 'code', 'description', 'active'])
    expect(findingCategories('type-1').create().initialData).toEqual({ findingTypeId: 'type-1', active: true })
    expect(findingCauses('type-1', 'category-1').create().initialData).toEqual({ findingCategoryId: 'category-1', active: true })
  })

  it('keeps separate resource permissions and nested routes', () => {
    expect(resourceActionForRoute('master-data-hsse-observation')).toMatchObject({ resourceKey: 'finding-types', action: 'list', permission: 'view-finding-types' })
    expect(resourceActionForRoute('master-data-hsse-observation-detail-categories')).toMatchObject({ resourceKey: 'finding-categories.type-1', action: 'list', permission: 'view-finding-categories' })
    expect(resourceActionForRoute('master-data-hsse-observation-detail-categories-detail-causes')).toMatchObject({
      resourceKey: 'finding-cause.type-1.category-1',
      action: 'list',
      permission: 'view-finding-cause',
    })
    expect(findingTypes.list().detailRoute?.({ id: 'type-1' } as never)).toEqual({ name: 'master-data-hsse-observation-detail', params: { findingTypeId: 'type-1' } })
    expect(
      findingCategories('type-1')
        .list()
        .detailRoute?.({ id: 'category-1' } as never)
    ).toEqual({ name: 'master-data-hsse-observation-detail-categories-detail', params: { findingTypeId: 'type-1', findingCategoryId: 'category-1' } })
    expect(
      findingCauses('type-1', 'category-1')
        .list()
        .detailRoute?.({ id: 'cause-1' } as never)
    ).toEqual({ name: 'master-data-hsse-observation-detail-categories-detail-causes-detail', params: { findingTypeId: 'type-1', findingCategoryId: 'category-1', findingCauseId: 'cause-1' } })
  })
})
