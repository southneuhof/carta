import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, nextTick, onMounted } from 'vue'
import App from './App.vue'
import { reloadPage } from './reload'
import { identityStatus } from './framework/identity'

vi.mock('./reload', () => ({ reloadPage: vi.fn() }))

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  identityStatus.value = 'unknown'
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows a generic reload action when a route render fails', async () => {
    const error = new Error('private route details')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const brokenRoute = defineComponent({ setup: () => { onMounted(() => { throw error }); return () => '<div />' } })
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        config: { errorHandler: () => undefined },
        stubs: { RouterView: brokenRoute, Toaster: true, Spinner: true },
      },
    })
    mounted.push(wrapper)
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('Something went wrong.')
    expect(wrapper.text()).not.toContain('private route details')
    await wrapper.get('button').trigger('click')
    expect(reloadPage).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalled()
  })

  it('keeps the route visible when no render error occurs', async () => {
    const healthyRoute = defineComponent({ template: '<p data-test="healthy">Healthy route</p>' })
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: { RouterView: healthyRoute, Toaster: true, Spinner: true },
      },
    })
    mounted.push(wrapper)
    await nextTick()

    expect(wrapper.get('[data-test="healthy"]').text()).toBe('Healthy route')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows the generic reload action when identity loading fails', async () => {
    identityStatus.value = 'failed'
    const healthyRoute = defineComponent({ template: '<p data-test="healthy">Healthy route</p>' })
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: { RouterView: healthyRoute, Toaster: true, Spinner: true },
      },
    })
    mounted.push(wrapper)
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('Something went wrong.')
    expect(wrapper.find('[data-test="healthy"]').exists()).toBe(false)
  })
})
