import { describe, expect, it } from 'vitest'
import { createRendererRegistries } from '@southneuhof/is-vue-framework'
import { appFieldRenderers } from './renderers'

describe('app field renderers', () => {
  it('registers every display renderer referenced by app defaults', () => {
    const registries = createRendererRegistries(appFieldRenderers)

    for (const key of ['chip', 'html', 'file', 'array-clauses']) {
      expect(registries.table.has(key)).toBe(true)
      expect(registries.detail.has(key)).toBe(true)
    }
  })
})
