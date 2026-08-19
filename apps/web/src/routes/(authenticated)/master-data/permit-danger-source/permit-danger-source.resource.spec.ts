import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults, resourceActionForRoute } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { permitDangerSources } from './permit-danger-source.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('permit danger source resource', () => {
  it('keeps the visible fields, exact labels, and static active options', () => {
    const keys = ['name', 'description', 'active']
    expect(fields(permitDangerSources.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(permitDangerSources.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)

    const formFields = fields(permitDangerSources.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'textarea', 'radio'])
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Deskripsi', 'Status'])
    expect(formFields.find((field) => field.key === 'name')?.props).toMatchObject({ required: true })
    expect(formFields.find((field) => field.key === 'active')).toMatchObject({
      renderer: 'radio',
      source: [
        { id: true, name: 'Aktif' },
        { id: false, name: 'Tidak Aktif' },
      ],
    })
    expect(permitDangerSources.create().initialData).toEqual({ active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'code', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps standard actions to the generated CRUD routes and permissions', () => {
    const list = permitDangerSources.list()
    expect(resourceActionForRoute('master-data-permit-danger-source')).toMatchObject({ resourceKey: 'permit-danger-source', action: 'list', permission: 'view-permit-danger-source' })
    expect(resourceActionForRoute('master-data-permit-danger-source-detail')).toMatchObject({ resourceKey: 'permit-danger-source', action: 'detail', permission: 'view-permit-danger-source' })
    expect(resourceActionForRoute('master-data-permit-danger-source-create')).toMatchObject({ resourceKey: 'permit-danger-source', action: 'create', permission: 'create-permit-danger-source' })
    expect(resourceActionForRoute('master-data-permit-danger-source-edit')).toMatchObject({ resourceKey: 'permit-danger-source', action: 'update', permission: 'update-permit-danger-source' })
    expect(list.createRoute).toEqual({ name: 'master-data-permit-danger-source-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-danger-source-detail', params: { permitDangerSourceId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-danger-source-edit', params: { permitDangerSourceId: '1' } })
    expect(list.canDelete?.({ id: '1', name: 'Listrik' })).toBe(true)
    expect(permitDangerSources.delete({ id: '1' })).toHaveProperty('run')
  })
})
