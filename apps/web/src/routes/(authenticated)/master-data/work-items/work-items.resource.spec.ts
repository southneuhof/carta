import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.resource'
import { uoms } from '../uoms/uoms.resource'
import { workItems } from './work-items.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('work items resource', () => {
  it('uses category and UOM lookups for the root form', () => {
    const formFields = fields(workItems.create().fields, 'form')
    expect(formFields.find((field) => field.key === 'categoryId')).toMatchObject({ renderer: 'lookup', source: ptsWorkCategories })
    expect(formFields.find((field) => field.key === 'uomId')).toMatchObject({ renderer: 'lookup', source: uoms })
    expect(formFields.find((field) => field.key === 'isHighRisk')?.renderer).toBe('radio')
  })

  it('hides category for the child form variant', () => {
    const category = fields(workItems.create({ context: { variant: 'child' } }).fields, 'form').find((field) => field.key === 'categoryId')!
    expect(category.behavior?.visible?.({ draft: {}, value: undefined, context: { variant: 'child' } } as never)).toBe(false)
  })

  it('keeps the tree surface free of technical fields', () => {
    expect(fields(workItems.list().fields, 'table').map((field) => field.key)).toEqual(['name', 'categoryId', 'volume', 'uomId', 'isHighRisk'])
    expect(fields(workItems.list().fields, 'table').map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'projectId', 'parentId', 'level', 'code', 'active']))
  })

  it('exposes tree loading as a custom action', () => {
    expect(workItems.actions.loadTree.run).toEqual(expect.any(Function))
  })
})
