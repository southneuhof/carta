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
import { lawReferenceItems } from './law-reference-items.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('Regulasi & Perundangan HSSE resource', () => {
  it('keeps the tree and dialog fields aligned with the legacy labels', () => {
    expect(fields(lawReferenceItems.list().fields, 'table').map((field) => field.key)).toEqual(['name', 'type', 'active'])
    expect(fields(lawReferenceItems.detail({ id: 'item-1' }).fields, 'detail').map((field) => field.key)).toEqual(['lawReferenceCategoryCode', 'name', 'level', 'type', 'parentId', 'active'])
    expect(fields(lawReferenceItems.create().fields, 'form').map((field) => field.label)).toEqual(['Nama', 'Tipe', 'Status'])
    expect(fields(lawReferenceItems.update({ id: 'item-1' }).fields, 'form').map((field) => field.label)).toEqual(['Nama', 'Tipe', 'Status'])
    expect(fields(lawReferenceItems.create().fields, 'form').find((field) => field.key === 'name')?.props).toMatchObject({ required: true })
  })

  it('hides type for child creation and exposes the permission mapping', () => {
    const type = fields(lawReferenceItems.create({ context: { variant: 'child' } }).fields, 'form').find((field) => field.key === 'type')!
    expect(type.behavior?.visible?.({ draft: {}, value: undefined, context: { variant: 'child' } } as never)).toBe(false)
    expect(resourceActionForRoute('master-data-law-reference-items')).toMatchObject({
      resourceKey: 'law-reference-items',
      action: 'list',
      permission: 'view-law-reference-items',
    })
    expect(lawReferenceItems.delete({ id: 'item-1' })).toHaveProperty('run')
  })
})
