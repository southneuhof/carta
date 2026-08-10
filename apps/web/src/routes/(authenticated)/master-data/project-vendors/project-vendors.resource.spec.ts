import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { projects } from '../projects/projects.resource'
import { projectVendors } from './project-vendors.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('project vendors resource', () => {
  it('uses the project resource for its parent lookup', () => {
    expect(fields(projectVendors.form().fields, 'form').find((field) => field.key === 'projectId')).toMatchObject({ renderer: 'lookup', source: projects })
  })

  it('keeps the required parent field in the create form', () => {
    expect(Object.keys(projectVendors.form().fields)).toContain('projectId')
  })

  it('hides the parent lookup in the project-scoped form', () => {
    const field = fields(projectVendors.form({ context: { scope: 'project' } }).fields, 'form').find((candidate) => candidate.key === 'projectId')!
    expect(field.behavior?.visible?.({ draft: {}, value: undefined, context: { scope: 'project' } } as never)).toBe(false)
  })
})
