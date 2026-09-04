import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, nextTick, onMounted } from 'vue'
import App from './App.vue'
import { reloadPage } from './reload'
import { identityError, identityStatus } from './framework/identity'

vi.mock('./reload', () => ({ reloadPage: vi.fn() }))

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  identityStatus.value = 'unknown'
  identityError.value = undefined
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows the route error message and reload action when a route render fails', async () => {
    const error = new Error('private route details')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const brokenRoute = defineComponent({
      setup: () => {
        onMounted(() => {
          throw error
        })
        return () => '<div />'
      },
    })
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
    expect(wrapper.get('[role="alert"]').text()).toContain('private route details')
    const reloadButton = wrapper.findAll('button').find((button) => button.text().includes('Reload'))
    expect(reloadButton).toBeDefined()
    await reloadButton!.trigger('click')
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
    identityError.value = new Error('Identity lookup failed')
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
    expect(wrapper.get('[role="alert"]').text()).toContain('Identity lookup failed')
    expect(wrapper.find('[data-test="healthy"]').exists()).toBe(false)
  })
})
