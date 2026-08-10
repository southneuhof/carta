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
    expect(fields(projects.form().fields, 'form').find((field) => field.key === 'divisionId')).toMatchObject({ renderer: 'lookup', source: divisions })
  })

  it('renders the related division name in the table', () => {
    const field = fields(projects.table().table.fields, 'table').find((candidate) => candidate.key === 'division')!
    expect(field.read?.({ division: { name: 'Division' } } as never, {})).toBe('Division')
    expect(projects.table().table.fields).not.toHaveProperty('divisionId')
  })

  it('keeps required project fields in the create form', () => {
    expect(Object.keys(projects.form().fields)).toEqual(expect.arrayContaining(['divisionId', 'number', 'integrationCode', 'name']))
    expect(fields(projects.table().table.fields, 'table').map((field) => field.key)).toContain('integrationCode')
  })

  it('uses the structured location input and keeps status out of the form', () => {
    const formFields = fields(projects.form().fields, 'form')
    expect(formFields.find((field) => field.key === 'location')).toMatchObject({ renderer: 'location' })
    expect(projects.form().fields).not.toHaveProperty('statusCode')
    expect(projects.form().fields).not.toHaveProperty('active')
  })
})
