import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PublicLayout from './public.layout.vue'

describe('public layout', () => {
  it('keeps unauthenticated content at the compact login width', () => {
    const wrapper = mount(PublicLayout, {
      global: {
        stubs: {
          AppRouterView: true,
        },
      },
    })

    const content = wrapper.get('[data-public-layout-content]')
    expect(content.classes()).toContain('max-w-screen-sm')
    expect(content.classes()).not.toContain('max-w-screen-2xl')
  })
})
