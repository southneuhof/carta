/**
 * Hand-translated fixture proving the legacy-to-catalog mapping table in
 * `src/fields/MIGRATION.md`. There are no converters: each screen is translated
 * by hand in plans 007-008, and this fixture is the worked example.
 */
import { describe, expect, it } from 'vitest'
import { nextTick, effectScope, reactive } from 'vue'
import { defineFields } from '../defineFields'
import { resolveFields } from '../resolve'
import { readFields } from '../access'
import { createBehaviorRuntime } from '../behavior'

/** The legacy `roles.config.ts` shape, kept verbatim for comparison. */
const legacyRolesConfig = {
  name: 'roles',
  title: 'Role',
  fields: ['name', 'section'],
  fieldsAlias: { name: 'Nama Role', section: 'Ruas' },
  fieldsProxy: { section: 'rel_section_name' },
  transaction: {
    fields: ['name', 'section', 'note'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      section: { type: 'select', props: { options: ['a', 'b'] } },
      note: {
        type: 'textarea',
        dependency: {
          fields: ['name'],
          visibility: { validator: (values: Record<string, unknown>) => values.name === 'admin', default: false },
        },
      },
    },
  },
}

interface Role extends Record<string, unknown> {
  name: string
  rel_section_name: string
  note?: string
}

/** fieldsAlias -> label, fieldsProxy -> read, type -> renderer, dependency -> behavior. */
const roleFields = defineFields<Role>()({
  name: {
    label: 'Nama Role',
    form: { renderer: 'text' },
  },
  section: {
    label: 'Ruas',
    read: (record) => record.rel_section_name,
    form: { renderer: 'select', props: { options: ['a', 'b'] } },
  },
  note: {
    label: 'Catatan',
    form: {
      renderer: 'textarea',
      behavior: { visible: ({ draft }) => draft.name === 'admin' },
    },
  },
})

describe('legacy roles config translated by hand', () => {
  it('preserves labels and field order on the table surface', () => {
    const fields = resolveFields({ fields: roleFields, surface: 'table', keys: legacyRolesConfig.fields })

    expect(fields.map((field) => field.key)).toEqual(legacyRolesConfig.fields)
    expect(fields.map((field) => field.label)).toEqual([
      legacyRolesConfig.fieldsAlias.name,
      legacyRolesConfig.fieldsAlias.section,
    ])
  })

  it('preserves computed values previously expressed as fieldsProxy', () => {
    const record: Role = { name: 'admin', rel_section_name: 'Ruas 1' }
    const fields = resolveFields({ fields: roleFields, surface: 'table', keys: legacyRolesConfig.fields })

    expect(readFields(record, fields)).toEqual({ name: 'admin', section: 'Ruas 1' })
  })

  it('preserves renderer selection previously expressed as inputConfig.type', () => {
    const fields = resolveFields({ fields: roleFields, surface: 'form', keys: legacyRolesConfig.transaction.fields })

    expect(fields.map((field) => field.renderer)).toEqual(['text', 'select', 'textarea'])
    expect(fields[1].props).toEqual({ options: ['a', 'b'] })
  })

  it('preserves dependency visibility as behavior without a depends-on list', async () => {
    const draft = reactive<Record<string, unknown>>({ name: 'viewer' })
    const fields = resolveFields({ fields: roleFields, surface: 'form', keys: legacyRolesConfig.transaction.fields })
    const scope = effectScope()
    const runtime = scope.run(() => createBehaviorRuntime({ fields, draft }))!

    const legacyVisible = legacyRolesConfig.transaction.inputConfig.note.dependency?.visibility
    expect(legacyVisible?.validator({ name: draft.name })).toBe(runtime.state('note').value.visible)

    draft.name = 'admin'
    await nextTick()

    expect(runtime.state('note').value.visible).toBe(true)
    expect(runtime.visibleDraft.value).toEqual({ name: 'admin' })
    scope.stop()
  })
})
