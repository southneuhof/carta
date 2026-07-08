import { createApp, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tabs from '../Tabs.vue'

const routerReplace = vi.fn()
const route = {
  name: 'dashboard',
  query: {} as Record<string, unknown>,
}

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: routerReplace }),
  useRoute: () => route,
}))

const mounted: Array<ReturnType<typeof createApp>> = []

function mountTabs(props: Record<string, unknown> = {}, slots: Record<string, any> = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const model = ref(0)
  const change = vi.fn()

  const app = createApp({
    render() {
      return h(
        Tabs,
        {
          modelValue: model.value,
          'onUpdate:modelValue': (value: number) => (model.value = value),
          onChange: change,
          config: [{ name: 'One' }, { name: 'Two' }],
          static: true,
          ...props,
        },
        slots,
      )
    },
  })

  mounted.push(app)
  app.mount(host)

  return { host, model, change }
}

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount()
  document.body.innerHTML = ''
  routerReplace.mockReset()
  route.query = {}
})

describe('Tabs', () => {
  it('emits change and updates v-model when a tab is selected', async () => {
    const { host, model, change } = mountTabs({ variant: 'pill' })
    await nextTick()

    ;(host.querySelectorAll('button')[1] as HTMLButtonElement).click()
    await nextTick()

    expect(model.value).toBe(1)
    expect(change).toHaveBeenCalledWith(1)
  })

  it('does not fire disabled custom tabs', async () => {
    const { host, model, change } = mountTabs(
      {
        variant: 'custom',
        config: [{ name: 'One' }, { name: 'Two', disabled: true }],
      },
      {
        tab: ({ tab }: { tab: { name: string } }) => h('span', tab.name),
      },
    )
    await nextTick()

    ;(host.querySelectorAll('button')[1] as HTMLButtonElement).click()
    await nextTick()

    expect(model.value).toBe(0)
    expect(change).not.toHaveBeenCalledWith(1)
  })
})
