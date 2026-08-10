import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import {
  businessCategories,
  divisions,
  numberConfigs,
  numberVariables,
  projects,
  projectVendors,
  ptsWorkCategories,
  rootCauses,
  uoms,
  workItems,
} from './master-data.resources'

beforeEach(() => {
  registerResourceRuntime({
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
  })
})

afterEach(() => resetResourceRuntimeForTests())

function fields(fields: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({
    fields: fields as never,
    surface,
    defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields,
  })
}

describe('master-data resource forms', () => {
  it('uses existing resources for relationship lookups', () => {
    const division = fields(divisions.form().fields, 'form').find((field) => field.key === 'businessCategoryId')
    const project = fields(projects.form().fields, 'form').find((field) => field.key === 'divisionId')
    const workItem = fields(workItems.form().fields, 'form')
    const parentWorkItem = workItem.find((field) => field.key === 'parentId')
    const vendor = fields(projectVendors.form().fields, 'form').find((field) => field.key === 'projectId')
    const numberConfig = fields(numberConfigs.form().fields, 'form').find((field) => field.key === 'numberVariableCode')

    expect(division).toMatchObject({ renderer: 'lookup', source: businessCategories })
    expect(project).toMatchObject({ renderer: 'lookup', source: divisions })
    expect(workItem.find((field) => field.key === 'projectId')).toMatchObject({ renderer: 'lookup', source: projects })
    expect(parentWorkItem).toMatchObject({ renderer: 'lookup', source: workItems })
    expect(workItem.find((field) => field.key === 'uomId')).toMatchObject({ renderer: 'lookup', source: uoms })
    expect(vendor).toMatchObject({ renderer: 'lookup', source: projects })
    expect(numberConfig).toMatchObject({ renderer: 'lookup', source: numberVariables })
    expect(numberConfig?.props.pick).toBe('code')
    expect(numberConfig?.props.loadDetail).toEqual(expect.any(Function))
  })

  it('filters and resets parent work items when the project changes', () => {
    const field = fields(workItems.form().fields, 'form').find((candidate) => candidate.key === 'parentId')!
    const behavior = field.behavior!
    const context = { draft: { projectId: 'project-1' }, value: undefined, context: {} } as never

    expect(behavior.visible?.(context)).toBe(true)
    expect(behavior.props?.(context)).toEqual({ searchParameters: { projectId: 'project-1' } })
    expect(behavior.resetWhen?.(context)).toBe('project-1')
  })

  it('projects relation names instead of foreign-key values', () => {
    const division = fields(divisions.table().table.fields, 'table').find((field) => field.key === 'businessCategory')!
    const project = fields(projects.table().table.fields, 'table').find((field) => field.key === 'division')!
    const workItem = fields(workItems.table().table.fields, 'table').find((field) => field.key === 'project')!

    expect(division.read?.({ businessCategory: { name: 'Business' } } as never, {})).toBe('Business')
    expect(project.read?.({ division: { name: 'Division' } } as never, {})).toBe('Division')
    expect(workItem.read?.({ project: { name: 'Project' } } as never, {})).toBe('Project')
    expect(divisions.table().table.fields).not.toHaveProperty('businessCategoryId')
    expect(projects.table().table.fields).not.toHaveProperty('divisionId')
    expect(workItems.table().table.fields).not.toHaveProperty('projectId')
  })

  it('keeps required parent fields in the create forms', () => {
    expect(Object.keys(divisions.form().fields)).toContain('businessCategoryId')
    expect(Object.keys(projects.form().fields)).toEqual(expect.arrayContaining(['divisionId', 'number', 'integrationCode', 'name']))
    expect(Object.keys(workItems.form().fields)).toEqual(expect.arrayContaining(['projectId', 'code', 'name']))
    expect(Object.keys(projectVendors.form().fields)).toContain('projectId')
    expect(Object.keys(numberConfigs.form().fields)).toEqual(expect.arrayContaining(['numberVariableCode', 'displayOrder']))
  })

  it('aligns standard master-data surfaces', () => {
    const expectedKeys = ['name', 'code', 'description', 'active']
    const expectedRenderers = ['text', 'text', 'textarea', 'checkbox']

    for (const resource of [businessCategories, ptsWorkCategories, rootCauses]) {
      expect(fields(resource.table().table.fields, 'table').map((field) => field.key)).toEqual(expectedKeys)
      expect(fields(resource.detail({ id: '1' }).detail.fields, 'detail').map((field) => field.key)).toEqual(expectedKeys)

      const formFields = fields(resource.form().fields, 'form')
      expect(formFields.map((field) => field.key)).toEqual(expectedKeys)
      expect(formFields.map((field) => field.renderer)).toEqual(expectedRenderers)
      expect(formFields.every((field) => field.source === undefined)).toBe(true)
      expect(formFields.map((field) => field.key)).not.toEqual(expect.arrayContaining(['id', 'createdAt', 'updatedAt', 'createdByUserId', 'updatedByUserId']))
    }
  })
})
