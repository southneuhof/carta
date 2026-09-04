import { describe, expect, it } from 'vitest'
import { resolveFields } from '@southneuhof/loom'
import { appFieldDefaults } from './defaults'

describe('app field defaults', () => {
  it('owns normalized keyed defaults using the framework field schema', () => {
    expect(appFieldDefaults.fields.name.label).toBe('Name')
    expect(appFieldDefaults.fields.code.label).toBe('Code')
    expect(appFieldDefaults.fields.createdAt.display?.format).toBe('datetime')
    expect(appFieldDefaults.fields.startDate.display?.format).toBe('date')
    expect(appFieldDefaults.fields.endDate.display?.format).toBe('date')
    expect(appFieldDefaults.fields.description.table?.class).toContain('line-clamp-3')
    expect(appFieldDefaults.fields.statusCode.table?.align).toBe('center')
    expect(appFieldDefaults.fields.statusCode.form?.renderer).toBe('radio')
    expect(appFieldDefaults.fields.active.form?.initialValue?.()).toBe(true)
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

  it('resolves the active form default and its initial value', () => {
    const [active] = resolveFields({
      fields: { active: {} },
      surface: 'form',
      defaultFields: appFieldDefaults.fields,
    })

    expect(active).toMatchObject({ label: 'Status', renderer: 'switch' })
    expect(active.initialValue?.()).toBe(true)
  })
})
