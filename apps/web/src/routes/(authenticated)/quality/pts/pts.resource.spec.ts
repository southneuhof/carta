import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { pts, ptsLookupResources } from './pts.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('manual PTS resource', () => {
  it('keeps the approved create and update field order', () => {
    const expected = ['divisionId', 'projectId', 'ptsWorkCategoryId', 'workItemCategoryId', 'workItemId', 'locationZone', 'criteriaCode', 'rootCauseIds', 'location', 'imgBefore', 'description']
    expect(fields(pts.create().fields, 'form').map((field) => field.key)).toEqual(expected)
    expect(fields(pts.update({ id: 'pts-1' }).fields, 'form').map((field) => field.key)).toEqual(expected)
  })

  it('uses dependent lookup behavior and retained image validation', () => {
    const formFields = fields(pts.create().fields, 'form')
    const project = formFields.find((field) => field.key === 'projectId')!
    const category = formFields.find((field) => field.key === 'workItemCategoryId')!
    const item = formFields.find((field) => field.key === 'workItemId')!
    expect(project.source).toBe(ptsLookupResources.projectLookup)
    expect(project.behavior?.props?.({ draft: { divisionId: 'division-1' } } as never)).toEqual({ searchParameters: { divisionId: 'division-1' } })
    expect(category.behavior?.props?.({ draft: { projectId: 'project-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', rootOnly: true } })
    expect(item.behavior?.props?.({ draft: { projectId: 'project-1', workItemCategoryId: 'category-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', workItemCategoryId: 'category-1', leafOnly: true } })
    expect(formFields.find((field) => field.key === 'rootCauseIds')?.props).toMatchObject({ multi: true, required: true })
    expect(formFields.find((field) => field.key === 'imgBefore')?.props).toMatchObject({ required: true })
  })

  it('exposes standard routes and plain workflow actions', () => {
    const row = { id: 'pts-1' } as never
    expect(pts.list().detailRoute?.(row)).toEqual({ name: 'quality-pts-detail', params: { ptsId: 'pts-1' } })
    expect(pts.list().updateRoute?.(row)).toEqual({ name: 'quality-pts-edit', params: { ptsId: 'pts-1' } })
    expect(pts.actions.deleteReport.run).toEqual(expect.any(Function))
    expect(pts.actions.disposition.run).toEqual(expect.any(Function))
  })
})
