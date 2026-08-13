import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { divisions } from '@/routes/(authenticated)/master-data/divisions/divisions.resource'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { projectVendorLookup } from '@/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.resource'
import { ptsWorkCategories } from '@/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource'
import { rootCauses } from '@/routes/(authenticated)/master-data/root-causes/root-causes.resource'
import { workItems } from '@/routes/(authenticated)/master-data/work-items/work-items.resource'
import { users } from '@/routes/(authenticated)/settings/users/users.resource'
import { pts, ptsActionFields } from './pts.resource'

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

  it('uses owner resources and approved searchParameters', () => {
    const formFields = fields(pts.create().fields, 'form')
    const project = formFields.find((field) => field.key === 'projectId')!
    const category = formFields.find((field) => field.key === 'workItemCategoryId')!
    const item = formFields.find((field) => field.key === 'workItemId')!
    expect(formFields.find((field) => field.key === 'divisionId')?.source).toBe(divisions)
    expect(project.source).toBe(projects)
    expect(formFields.find((field) => field.key === 'ptsWorkCategoryId')?.source).toBe(ptsWorkCategories)
    expect(formFields.find((field) => field.key === 'rootCauseIds')?.source).toBe(rootCauses)
    expect(category.source).toBe(workItems)
    expect(item.source).toBe(workItems)
    expect(formFields.find((field) => field.key === 'divisionId')?.behavior?.props?.({ draft: {} } as never)).toEqual({ searchParameters: { permission: 'create-qhsse-pts', active: true } })
    expect(project.behavior?.props?.({ draft: { divisionId: 'division-1' } } as never)).toEqual({ searchParameters: { permission: 'create-qhsse-pts', divisionId: 'division-1', active: true } })
    expect(formFields.find((field) => field.key === 'ptsWorkCategoryId')?.behavior?.props?.({ draft: {} } as never)).toEqual({ searchParameters: { active: true } })
    expect(category.behavior?.props?.({ draft: { projectId: 'project-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', rootOnly: true, active: true } })
    expect(item.behavior?.props?.({ draft: { projectId: 'project-1', workItemCategoryId: 'category-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', workItemCategoryId: 'category-1', leafOnly: true, active: true } })
    expect(formFields.find((field) => field.key === 'rootCauseIds')?.behavior?.props?.({ draft: {} } as never)).toEqual({ searchParameters: { active: true } })
    expect(formFields.find((field) => field.key === 'rootCauseIds')?.props).toMatchObject({ multi: true, required: true })
    expect(formFields.find((field) => field.key === 'imgBefore')?.props).toMatchObject({ required: true })
    expect(ptsActionFields.somUserId.form.source).toBe(users)
    expect(ptsActionFields.projectVendorId.form.source).toBe(projectVendorLookup)
    expect(ptsActionFields.somUserId.form.behavior?.props?.({ draft: { projectId: 'project-1' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', statusCode: 'active' } })
    expect(ptsActionFields.projectVendorId.form.behavior?.props?.({ draft: { projectId: 'project-1', jobImplementorType: 'vendor' } } as never)).toEqual({ searchParameters: { projectId: 'project-1', active: true }, required: true })
  })

  it('exposes standard routes and plain workflow actions', () => {
    const row = { id: 'pts-1' } as never
    const detail = { name: 'quality-pts-detail', params: { ptsId: 'pts-1' } }
    const createTo = pts.create().defaultTo
    const updateTo = pts.update({ id: 'pts-1' }).defaultTo
    expect(pts.list().detailRoute?.(row)).toEqual(detail)
    expect(typeof createTo === 'function' ? createTo(row) : createTo).toEqual(detail)
    expect(typeof updateTo === 'function' ? updateTo(row) : updateTo).toEqual(detail)
    expect(pts.list().updateRoute?.(row)).toEqual({ name: 'quality-pts-edit', params: { ptsId: 'pts-1' } })
    expect(pts.actions.deleteReport.run).toEqual(expect.any(Function))
    expect(pts.actions.disposition.run).toEqual(expect.any(Function))
  })
})
