import { describe, expect, it } from 'vitest'
import { resolveFields } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from './defaults'

describe('app field defaults', () => {
  it('owns normalized keyed defaults using the framework field schema', () => {
    expect(appFieldDefaults.fields.name.label).toBe('Name')
    expect(appFieldDefaults.fields.code.label).toBe('Code')
    expect(appFieldDefaults.fields.createdAt.display?.format).toBe('datetime')
    expect(appFieldDefaults.fields.description.table?.class).toContain('line-clamp-3')
    expect(appFieldDefaults.fields.statusCode.table?.align).toBe('center')
    expect(appFieldDefaults.fields.statusCode.form?.renderer).toBe('radio')
  })

  it('feeds keyed defaults into field resolution below resource metadata', () => {
    const [defaulted] = resolveFields({
      fields: { statusCode: {} },
      surface: 'table',
      defaultFields: appFieldDefaults.fields,
    })
    const [overridden] = resolveFields({
      fields: { name: { label: 'Resource name' } },
      surface: 'detail',
      defaultFields: appFieldDefaults.fields,
    })

    expect(defaulted).toMatchObject({ label: 'Status', renderer: 'chip', align: 'center' })
    expect(overridden.label).toBe('Resource name')
  })
})
