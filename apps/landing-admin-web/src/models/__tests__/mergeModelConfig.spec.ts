import { describe, expect, it } from 'vitest'
import { mergeModelConfig, type ModelConfig } from '@southneuhof/is-data-model'

describe('mergeModelConfig', () => {
  it('deep merges nested objects and preserves untouched branches', () => {
    const base: ModelConfig = {
      name: 'users',
      title: 'Users',
      view: {
        list: {
          fields: ['a', 'b'],
          filter: {
            fields: ['status'],
          },
        },
      },
    }

    const merged = mergeModelConfig(base, {
      view: {
        list: {
          filter: {
            fields: ['status', 'role'],
          },
        },
      },
    })

    expect(merged.view?.list?.filter?.fields).toEqual(['status', 'role'])
    expect(merged.view?.list?.fields).toEqual(['a', 'b'])
  })

  it('replaces arrays instead of concatenating', () => {
    const base: ModelConfig = {
      name: 'roles',
      title: 'Roles',
      fields: ['role_name', 'role_code'],
    }

    const merged = mergeModelConfig(base, {
      fields: ['role_name'],
    })

    expect(merged.fields).toEqual(['role_name'])
  })

  it('replaces function values', () => {
    const base: ModelConfig = {
      name: 'roles',
      title: 'Roles',
      view: {
        list: {
          onDragChange: () => 'base',
        },
      },
    }

    const replacement = () => 'override'
    const merged = mergeModelConfig(base, {
      view: {
        list: {
          onDragChange: replacement,
        },
      },
    })

    expect(merged.view?.list?.onDragChange).toBe(replacement)
  })

  it('keeps base value when override is undefined', () => {
    const base: ModelConfig = {
      name: 'tasks',
      title: 'Tasks',
      permission: 'task-permission',
    }

    const merged = mergeModelConfig(base, {
      permission: undefined,
    })

    expect(merged.permission).toBe('task-permission')
  })

  it('supports null as explicit override', () => {
    const base: ModelConfig = {
      name: 'users',
      title: 'Users',
      view: {
        list: {
          fieldsType: {
            status_code: { type: 'chip' },
          },
        },
      },
    }

    const merged = mergeModelConfig(base, {
      view: {
        list: {
          fieldsType: null as any,
        },
      },
    })

    expect(merged.view?.list?.fieldsType).toBeNull()
  })

  it('does not mutate the base object', () => {
    const base: ModelConfig = {
      name: 'users',
      title: 'Users',
      view: {
        list: {
          fields: ['name', 'email'],
        },
      },
    }

    const merged = mergeModelConfig(base, {
      view: {
        list: {
          fields: ['name'],
        },
      },
    })

    expect(base.view?.list?.fields).toEqual(['name', 'email'])
    expect(merged.view?.list?.fields).toEqual(['name'])
    expect(merged).not.toBe(base)
  })
})
