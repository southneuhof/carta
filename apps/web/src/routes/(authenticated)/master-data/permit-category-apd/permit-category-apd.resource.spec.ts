import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults, resourceActionForRoute } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { permitCategoryApds } from './permit-category-apd.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Permit Category APD resource', () => {
  it('keeps the parent field contract and exact labels', () => {
    const keys = ['name', 'description', 'active']
    expect(fields(permitCategoryApds.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(permitCategoryApds.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(permitCategoryApds.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'textarea', 'radio'])
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Deskripsi', 'Status'])
    expect(formFields.find((field) => field.key === 'active')).toMatchObject({ renderer: 'radio', source: [{ id: true, name: 'Aktif' }, { id: false, name: 'Tidak Aktif' }] })
    expect(permitCategoryApds.create().initialData).toEqual({ active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'code', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps parent actions to standard routes and permissions', () => {
    const list = permitCategoryApds.list()
    expect(resourceActionForRoute('master-data-permit-category-apd')).toMatchObject({ resourceKey: 'permit-category-apd', action: 'list', permission: 'view-permit-category-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-detail')).toMatchObject({ resourceKey: 'permit-category-apd', action: 'detail', permission: 'view-permit-category-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-create')).toMatchObject({ resourceKey: 'permit-category-apd', action: 'create', permission: 'create-permit-category-apd' })
    expect(resourceActionForRoute('master-data-permit-category-apd-edit')).toMatchObject({ resourceKey: 'permit-category-apd', action: 'update', permission: 'update-permit-category-apd' })
    expect(list.createRoute).toEqual({ name: 'master-data-permit-category-apd-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-category-apd-detail', params: { permitCategoryApdId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-category-apd-edit', params: { permitCategoryApdId: '1' } })
    expect(permitCategoryApds.delete({ id: '1' })).toHaveProperty('run')
  })
})
