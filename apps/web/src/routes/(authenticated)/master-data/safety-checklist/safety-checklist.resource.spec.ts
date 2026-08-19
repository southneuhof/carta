import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults, resourceActionForRoute } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { safetyChecklists } from './safety-checklist.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Safety Checklist resource', () => {
  it('exposes only the configured domain fields', () => {
    const keys = ['name', 'active']
    expect(fields(safetyChecklists.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(safetyChecklists.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)
    const formFields = fields(safetyChecklists.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'radio'])
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Status'])
    expect(formFields.find((field) => field.key === 'name')?.props).toMatchObject({ required: true })
    expect(formFields.find((field) => field.key === 'active')).toMatchObject({
      renderer: 'radio',
      source: [
        { id: true, name: 'Aktif' },
        { id: false, name: 'Tidak Aktif' },
      ],
    })
    expect(safetyChecklists.create().initialData).toEqual({ active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'description', 'code', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps standard CRUD routes', () => {
    const list = safetyChecklists.list()
    expect(resourceActionForRoute('master-data-safety-checklist')).toMatchObject({ resourceKey: 'safety-checklist', action: 'list', permission: 'view-safety-checklist' })
    expect(resourceActionForRoute('master-data-safety-checklist-detail')).toMatchObject({ resourceKey: 'safety-checklist', action: 'detail', permission: 'view-safety-checklist' })
    expect(resourceActionForRoute('master-data-safety-checklist-create')).toMatchObject({ resourceKey: 'safety-checklist', action: 'create', permission: 'create-safety-checklist' })
    expect(resourceActionForRoute('master-data-safety-checklist-edit')).toMatchObject({ resourceKey: 'safety-checklist', action: 'update', permission: 'update-safety-checklist' })
    expect(list.createRoute).toEqual({ name: 'master-data-safety-checklist-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-safety-checklist-detail', params: { safetyChecklistId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-safety-checklist-edit', params: { safetyChecklistId: '1' } })
    expect(safetyChecklists.delete({ id: '1' })).toHaveProperty('run')
  })
})
