import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRendererRegistries } from '@southneuhof/loom'
import { appFieldRenderers } from './renderers'

describe('app field renderers', () => {
  it('registers the app display renderers', () => {
    const registries = createRendererRegistries(appFieldRenderers)

    for (const key of ['chip', 'html', 'image', 'file', 'array-clauses']) {
      expect(registries.table.has(key)).toBe(true)
      expect(registries.detail.has(key)).toBe(true)
    }
  })

  it('renders an asset object through the image preview', () => {
    const renderer = createRendererRegistries(appFieldRenderers).detail.get('image')
    if (!renderer) throw new Error('Image renderer is not registered.')

    const view = mount(renderer, {
      props: {
        value: { kind: 'file', id: 'uploads/cover.png', url: 'https://files.test/cover.png', name: 'cover.png' },
      },
    })

    expect(view.find('img').attributes('src')).toBe('https://files.test/cover.png')
    view.unmount()
  })
})
