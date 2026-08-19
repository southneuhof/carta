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
import { permitAttachments } from './permit-attachment.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('permit attachment resource', () => {
  it('keeps the visible fields, exact labels, and hidden relation', () => {
    const keys = ['name', 'description', 'active']
    expect(fields(permitAttachments.list().fields, 'table').map((field) => field.key)).toEqual(keys)
    expect(fields(permitAttachments.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(keys)

    const formFields = fields(permitAttachments.create().fields, 'form')
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
    expect(permitAttachments.create().initialData).toEqual({ active: true })
    expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'code', 'permitWorkTypeId', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
  })

  it('maps standard actions to the generated CRUD routes and permissions', () => {
    const list = permitAttachments.list()
    expect(resourceActionForRoute('master-data-permit-attachment')).toMatchObject({ resourceKey: 'permit-attachment', action: 'list', permission: 'view-permit-attachment' })
    expect(resourceActionForRoute('master-data-permit-attachment-detail')).toMatchObject({ resourceKey: 'permit-attachment', action: 'detail', permission: 'view-permit-attachment' })
    expect(resourceActionForRoute('master-data-permit-attachment-create')).toMatchObject({ resourceKey: 'permit-attachment', action: 'create', permission: 'create-permit-attachment' })
    expect(resourceActionForRoute('master-data-permit-attachment-edit')).toMatchObject({ resourceKey: 'permit-attachment', action: 'update', permission: 'update-permit-attachment' })
    expect(list.createRoute).toEqual({ name: 'master-data-permit-attachment-create' })
    expect(list.detailRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-attachment-detail', params: { permitAttachmentId: '1' } })
    expect(list.updateRoute?.({ id: '1' } as never)).toEqual({ name: 'master-data-permit-attachment-edit', params: { permitAttachmentId: '1' } })
    expect(list.canDelete?.({ id: '1', name: 'Checklist Hot Work' })).toBe(true)
    expect(permitAttachments.delete({ id: '1' })).toHaveProperty('run')
  })
})
