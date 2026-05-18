import { beforeEach, describe, expect, it } from 'vitest'
import { resetFrameworkBehaviorsForTests } from '../behaviors'
import { applyFrameworkDefaults, defaultDetailConfig, defaultFormConfig, defaultTableConfig } from '../defaults'

describe('component default resolution compatibility', () => {
  beforeEach(() => {
    resetFrameworkBehaviorsForTests()
  })

  it('matches Table.vue default resolution shape', () => {
    applyFrameworkDefaults({
      table: {
        fieldsAlias: { name: 'Nama Kolom' },
        fieldsClass: { name: 'truncate' },
        fieldsType: { active: { type: 'chip' } },
        fieldsAlign: { active: 'center' },
      },
    })

    const resolved = {
      fieldsAlias: { ...defaultTableConfig.fieldsAlias, ...(undefined ?? {}) },
      fieldsClass: { ...defaultTableConfig.fieldsClass, ...(undefined ?? {}) },
      fieldsType: { ...defaultTableConfig.fieldsType, ...(undefined ?? {}) },
      fieldsAlign: { ...defaultTableConfig.fieldsAlign, ...(undefined ?? {}) },
    }

    expect(resolved.fieldsAlias.name).toBe('Nama Kolom')
    expect(resolved.fieldsClass.name).toBe('truncate')
    expect(resolved.fieldsType.active?.type).toBe('chip')
    expect(resolved.fieldsAlign.active).toBe('center')
  })

  it('matches Detail.vue default resolution shape', () => {
    applyFrameworkDefaults({
      detail: {
        fieldsAlias: { name: 'Nama Detail' },
        fieldsType: { name: { type: 'html' } },
      },
    })

    const resolved = {
      fieldsAlias: { ...defaultDetailConfig.fieldsAlias, ...(undefined ?? {}) },
      fieldsType: { ...defaultDetailConfig.fieldsType, ...(undefined ?? {}) },
    }

    expect(resolved.fieldsAlias.name).toBe('Nama Detail')
    expect(resolved.fieldsType.name?.type).toBe('html')
  })

  it('matches Form.vue default resolution shape', () => {
    applyFrameworkDefaults({
      form: {
        fieldsAlias: { name: 'Nama Form' },
        inputConfig: { name: { type: 'text', props: { required: true } } },
      },
    })

    const resolved = {
      fieldsAlias: { ...defaultFormConfig.fieldsAlias, ...(undefined ?? {}) },
      inputConfig: { ...defaultFormConfig.inputConfig, ...(undefined ?? {}) },
    }

    expect(resolved.fieldsAlias.name).toBe('Nama Form')
    expect(resolved.inputConfig.name?.type).toBe('text')
    expect((resolved.inputConfig.name as any)?.props?.required).toBe(true)
  })
})
