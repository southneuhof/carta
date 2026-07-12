import { createApp, defineComponent, h, nextTick, Suspense, type Component } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FrameworkPlugin } from '../../../adapters/plugin'
import Detail from '../Detail.vue'
import Table from '../Table.vue'

const mounted: Array<ReturnType<typeof createApp>> = []

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  })
})

async function mountAsync(component: Component, props: Record<string, unknown>, slots: Record<string, any>, defaults = {}) {
  const host = document.createElement('div')
  document.body.append(host)

  const app = createApp({
    render: () => h(Suspense, null, { default: () => h(component, props, slots) }),
  })
  app.use(FrameworkPlugin, { runtime: {}, defaults })
  mounted.push(app)
  app.mount(host)
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
  return host
}

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('shared view field slots', () => {
  it('renders view-{field} in list and detail with their existing slot props', async () => {
    const listSlot = vi.fn(({ data, index }) => h('span', { 'data-testid': 'list-shared' }, `${data.name}:${index}`))
    const detailSlot = vi.fn(({ data, index }) => h('span', { 'data-testid': 'detail-shared' }, `${data.name}:${index}`))

    const list = await mountAsync(Table, { fields: ['name'], data: [{ name: 'Ada' }] }, { 'view-name': listSlot })
    const detail = await mountAsync(Detail, { fields: ['name'], data: { name: 'Ada' } }, { 'view-name': detailSlot })

    expect(list.querySelector('[data-testid="list-shared"]')?.textContent).toBe('Ada:0')
    expect(detail.querySelector('[data-testid="detail-shared"]')?.textContent).toBe('Ada:0')
    expect(listSlot).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Ada' }, index: 0 }))
    expect(detailSlot).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Ada' }, index: 0 }))
  })

  it('prefers scoped field slots over the shared slot', async () => {
    const shared = vi.fn(() => h('span', 'shared'))
    const listScoped = vi.fn(() => h('span', { 'data-testid': 'list-scoped' }, 'list'))
    const detailScoped = vi.fn(() => h('span', { 'data-testid': 'detail-scoped' }, 'detail'))

    const list = await mountAsync(Table, { fields: ['name'], data: [{ name: 'Ada' }] }, { 'view-name': shared, 'list-name': listScoped })
    const detail = await mountAsync(Detail, { fields: ['name'], data: { name: 'Ada' } }, { 'view-name': shared, 'detail-name': detailScoped })

    expect(list.querySelector('[data-testid="list-scoped"]')?.textContent).toBe('list')
    expect(detail.querySelector('[data-testid="detail-scoped"]')?.textContent).toBe('detail')
    expect(shared).not.toHaveBeenCalled()
  })

  it('keeps configured field renderers above slots and default rendering last', async () => {
    const ConfiguredRenderer = defineComponent({
      props: ['data'],
      setup: (props) => () => h('span', { 'data-testid': 'configured' }, props.data?.data?.name ?? props.data?.name),
    })
    const shared = vi.fn(() => h('span', 'shared'))

    const configuredList = await mountAsync(
      Table,
      { fields: ['name'], data: [{ name: 'Ada' }] },
      { 'view-name': shared, 'list-name': shared },
      { table: { fieldSlots: { name: ConfiguredRenderer } } },
    )
    const configuredDetail = await mountAsync(
      Detail,
      { fields: ['name'], data: { name: 'Ada' } },
      { 'view-name': shared, 'detail-name': shared },
      { detail: { fieldSlots: { name: ConfiguredRenderer } } },
    )
    const defaultList = await mountAsync(Table, { fields: ['name'], data: [{ name: 'Ada' }] }, {})
    const defaultDetail = await mountAsync(Detail, { fields: ['name'], data: { name: 'Ada' } }, {})

    expect(configuredList.querySelector('[data-testid="configured"]')?.textContent).toBe('Ada')
    expect(configuredDetail.querySelector('[data-testid="configured"]')?.textContent).toBe('Ada')
    expect(shared).not.toHaveBeenCalled()
    expect(defaultList.textContent).toContain('Ada')
    expect(defaultDetail.textContent).toContain('Ada')
  })
})
