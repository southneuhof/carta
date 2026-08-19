import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { permitWorkTypes } from './permit-work-types.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('permit work types resource', () => {
  it('keeps the visible fields, exact labels, and static active options', () => {
    const keys = ['name', 'description', 'active']
    expect(fields(permitWorkTypes.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(permitWorkTypes.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)

    const formFields = fields(permitWorkTypes.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(keys)
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'textarea', 'radio'])
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Deskripsi', 'Status'])
    expect(formFields.find((field) => field.key === 'active')).toMatchObject({
      renderer: 'radio',
      source: [
        { id: true, name: 'Aktif' },
        { id: false, name: 'Tidak Aktif' },
      ],
    })
    expect(permitWorkTypes.create().initialData).toEqual({ active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'code', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps standard actions to the generated CRUD routes', () => {
    const list = permitWorkTypes.list()
    expect(list.createRoute).toEqual({ name: 'master-data-permit-work-types-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-work-types-detail', params: { permitWorkTypeId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-work-types-edit', params: { permitWorkTypeId: '1' } })
    expect(permitWorkTypes.delete({ id: '1' })).toHaveProperty('run')
  })
})
