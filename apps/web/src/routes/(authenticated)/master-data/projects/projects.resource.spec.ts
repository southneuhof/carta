import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { divisions } from '../divisions/divisions.resource'
import { projects } from './projects.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('projects resource', () => {
  it('uses the division resource for its parent lookup', () => {
    expect(fields(projects.create().fields, 'form').find((field) => field.key === 'divisionId')).toMatchObject({ renderer: 'lookup', source: divisions })
  })

  it('renders the related division name in the table', () => {
    const field = fields(projects.list().fields, 'table').find((candidate) => candidate.key === 'division')!
    expect(field.read?.({ division: { name: 'Division' } } as never, {})).toBe('Division')
    expect(fields(projects.list().fields, 'table').map((candidate) => candidate.key)).not.toContain('divisionId')
  })

  it('keeps required project fields in the create form', () => {
    expect(fields(projects.create().fields, 'form').map((field) => field.key)).toEqual(expect.arrayContaining(['divisionId', 'number', 'integrationCode', 'name']))
    expect(fields(projects.list().fields, 'table').map((field) => field.key)).toContain('integrationCode')
  })

  it('uses the structured location input and keeps status out of the form', () => {
    const formFields = fields(projects.create().fields, 'form')
    expect(formFields.find((field) => field.key === 'location')).toMatchObject({ renderer: 'location' })
    expect(fields(projects.create().fields, 'form').map((field) => field.key)).not.toEqual(expect.arrayContaining(['statusCode', 'active']))
  })
})
